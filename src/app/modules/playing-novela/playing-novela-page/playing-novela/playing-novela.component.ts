import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  IConversacion,
  IDecision,
  IEntrada,
  IExplora,
  IJuega,
  ITermina,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
  instanceOfIExplora,
  instanceOfIJuega,
  instanceOfITermina,
  MixRecursosType,
} from '@models/recurso.interfaces';
import { IDefiniciones, IEstadoJuego, IMinijuegoConfig, IResultadoMinijuego } from '@models/motor.interfaces';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { IPersonaje } from '@models/personaje.interfaces';
import { IBackground } from '@models/background.interfaces';
import { NovelasService } from '@services/novelas.service';
import { UsuariosService } from '@services/usuarios.service';
import { AuthService } from '@services/auth.service';
import { LecturasService } from '@services/lecturas.service';
import { UploadsService } from '@services/uploads.service';
import {
  NovelaPlayerService,
  IRecursoArte,
} from 'src/app/shared/services/novela-player.service';
import { IFinalVista, IHudItem, IItemMochila, ILogroVista, IOpcionJuego, IZonaJuego, NovelaMotor } from 'src/app/shared/engine/motor';
import { normalizarEstado, reiniciarPartida } from 'src/app/shared/engine/estado';
import { NovelaStageComponent } from 'src/app/shared/components/novela-stage/novela-stage.component';
import { MotorDebugPanelComponent } from 'src/app/shared/components/motor-debug-panel/motor-debug-panel.component';

@Component({
  selector: 'app-playing-novela',
  templateUrl: './playing-novela.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NovelaStageComponent, MotorDebugPanelComponent],
})
export class PlayingNovelaComponent implements OnInit, OnDestroy {
  @Input() novelaId: string = '';
  /** 'jugar' registra Lectura/LecturaRecursos y guarda la partida sobre la versión publicada; 'preview' solo lee el borrador, sin registrar progreso, y muestra el depurador. */
  @Input() modo: 'jugar' | 'preview' = 'jugar';

  cargando = true;
  sinContenido = false;

  recursoMap = new Map<string, MixRecursosType>();
  personajes: IPersonaje[] = [];
  backgrounds: IBackground[] = [];

  motor?: NovelaMotor;
  estado: IEstadoJuego = { vars: {} };
  /** Historia terminada sin llegar a un recurso que mostrar (p. ej. un Asigna sin siguiente). */
  terminado = false;
  errorMotor?: string;

  recursoActual?: MixRecursosType;
  arteActual: IRecursoArte = {};
  opciones: IOpcionJuego[] = [];
  zonas: IZonaJuego[] = [];
  mochila: IItemMochila[] = [];
  ubicacionNombre = '';
  hud: IHudItem[] = [];
  /** Sube cada vez que se presenta un nodo: reinicia el minijuego aunque un reintento vuelva al mismo. */
  presentacion = 0;
  logrosVista: ILogroVista[] = [];
  /** Aviso del último logro desbloqueado; se borra solo. */
  toastLogro = '';
  private logrosAnunciados = new Set<string>();
  private temporizadorToast?: ReturnType<typeof setTimeout>;

  private version?: INovelaVersion;
  private recursoInicialId?: string;

  lecturaId?: string;
  ordenActual = 0;

  constructor(
    private novelasService: NovelasService,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private lecturasService: LecturasService,
    private novelaPlayerService: NovelaPlayerService,
    private uploadsService: UploadsService
  ) {}

  ngOnDestroy(): void {
    clearTimeout(this.temporizadorToast);
  }

  ngOnInit(): void {
    if (this.modo === 'preview') {
      this.iniciarPreview();
    } else {
      this.iniciarJuego();
    }
  }

  private iniciarPreview(): void {
    forkJoin({
      novela: this.novelasService.getNovela(
        this.novelaId,
        'False',
        'True',
        'True'
      ),
      version: this.novelaPlayerService
        .cargarBorrador(this.novelaId)
        .pipe(catchError(() => of(undefined))),
    }).subscribe(({ novela, version }) => {
      this.cargando = false;

      if (!version) {
        this.sinContenido = true;
        return;
      }

      this.personajes = novela.personajes || [];
      this.backgrounds = novela.backgrounds || [];
      this.prepararMotor(version);
      this.reiniciar();
    });
  }

  private iniciarJuego(): void {
    const usuarioId = this.authService.decodeJWT(
      this.authService.readToken()
    ).userId;

    forkJoin({
      usuario: this.usuariosService.getUsuarioById(usuarioId),
      novela: this.novelasService.getNovela(
        this.novelaId,
        'False',
        'True',
        'True'
      ),
      version: this.novelaPlayerService
        .cargarVersionPublicada(this.novelaId)
        .pipe(catchError(() => of(undefined))),
    }).subscribe(({ usuario, novela, version }) => {
      this.cargando = false;

      if (!version) {
        this.sinContenido = true;
        return;
      }

      this.personajes = novela.personajes || [];
      this.backgrounds = novela.backgrounds || [];
      this.prepararMotor(version);

      const lecturaExistente = usuario.lecturas?.find(
        l => l.novelaRegistrosId === this.novelaId
      );

      if (lecturaExistente) {
        this.lecturaId = lecturaExistente.lecturaId;
        const trail = lecturaExistente.recursos || [];
        // El orden del último paso, no la cantidad: la historia puede pasar varias veces por un recurso.
        this.ordenActual = trail.reduce((max, p) => Math.max(max, p.recursoOrder), 0);

        const guardadoId = lecturaExistente.recursoActualId;
        const mismaVersion =
          lecturaExistente.novelaVersionId === version.novelaVersionId;

        if (guardadoId && mismaVersion && this.recursoMap.has(guardadoId)) {
          // Partida con motor: se retoma en el recurso donde quedó, con las variables que tenía.
          this.estado = normalizarEstado(
            lecturaExistente.estado,
            this.motor!.defs
          );
          // Los logros de partidas anteriores no se anuncian otra vez al retomarla.
          this.logrosAnunciados = new Set(this.estado.logros ?? []);
          this.mostrarResolucion(guardadoId, false);
          return;
        }

        if (!guardadoId) {
          // Lectura anterior al motor: solo hay rastro de recursos; se retoma en el último con variables iniciales.
          const ultimo = trail.find(p => p.recursoOrder === this.ordenActual);
          this.mostrarResolucion(
            (ultimo && this.recursoMap.has(ultimo.recursoId)
              ? ultimo.recursoId
              : this.recursoInicialId),
            false
          );
          return;
        }

        // La novela se republicó y el punto guardado ya no sirve: se vuelve al inicio con estado nuevo.
        this.avanzarA(this.recursoInicialId);
        return;
      }

      this.lecturasService
        .postLectura({
          novelaRegistrosId: this.novelaId,
          usuarioPropietarioId: usuarioId,
          novelaVersionId: version.novelaVersionId,
        })
        .subscribe(lecturaId => {
          this.lecturaId = lecturaId;
          this.avanzarA(this.recursoInicialId);
        });
    });
  }

  private prepararMotor(version: INovelaVersion): void {
    const definiciones: IDefiniciones = version.definiciones ?? { variables: [] };

    this.version = version;
    this.recursoMap = this.novelaPlayerService.construirMapaRecursos(version);
    this.recursoInicialId =
      this.novelaPlayerService.resolverRecursoInicial(version)?.recursoId;
    this.motor = new NovelaMotor(this.recursoMap, definiciones);
    this.estado = this.motor.estadoInicial();
  }

  /** Vuelve al principio con las variables iniciales (vista previa). */
  reiniciar(): void {
    if (!this.motor) {
      return;
    }
    this.estado = this.motor.estadoInicial();
    this.logrosAnunciados.clear();
    this.avanzarA(this.recursoInicialId);
  }

  /** Vuelve a jugar desde el principio; los logros y los finales ya vistos se conservan. */
  empezarDeNuevo(): void {
    if (!this.motor) {
      return;
    }
    this.estado = reiniciarPartida(this.estado, this.motor.defs);
    this.terminado = false;
    this.avanzarA(this.recursoInicialId);
  }

  /** Vuelve al principio conservando las variables como están (depurador de la vista previa). */
  irAlInicio(): void {
    this.avanzarA(this.recursoInicialId);
  }

  get definiciones(): IDefiniciones {
    return this.motor?.defs ?? { variables: [] };
  }

  get esConversacion(): boolean {
    return !!this.recursoActual && instanceOfIConversacion(this.recursoActual);
  }

  get esDecision(): boolean {
    return !!this.recursoActual && instanceOfIDecision(this.recursoActual);
  }

  get esEntrada(): boolean {
    return !!this.recursoActual && instanceOfIEntrada(this.recursoActual);
  }

  get esExplora(): boolean {
    return !!this.recursoActual && instanceOfIExplora(this.recursoActual);
  }

  /** El depurador solo tiene algo que mostrar si la versión define variables, objetos o ubicaciones. */
  get hayDefiniciones(): boolean {
    const d = this.definiciones;
    return d.variables.length > 0 || !!d.objetos?.length || !!d.ubicaciones?.length;
  }

  get esTermina(): boolean {
    return !!this.recursoActual && instanceOfITermina(this.recursoActual);
  }

  get tieneLogros(): boolean {
    return !!this.motor?.tieneLogros;
  }

  /** La tarjeta del final, si el nodo actual es un Termina. */
  get finalVista(): IFinalVista | null {
    if (!this.motor || !this.recursoActual || !instanceOfITermina(this.recursoActual)) {
      return null;
    }
    const termina = this.recursoActual as ITermina;
    const resumen = this.motor.resumenFinales(this.estado);
    return {
      titulo: this.motor.finalDe(termina)?.nombre || termina.final,
      mensaje: this.motor.texto(termina.mensaje || '', this.estado),
      descubiertos: resumen.descubiertos,
      total: resumen.total,
    };
  }

  get esJuega(): boolean {
    return !!this.recursoActual && instanceOfIJuega(this.recursoActual);
  }

  /** El minijuego que se está jugando ahora, o null si el nodo actual no es un Juega o la historia ya terminó. */
  get minijuego(): IMinijuegoConfig | null {
    return !this.terminado && this.recursoActual && instanceOfIJuega(this.recursoActual)
      ? (this.recursoActual as IJuega).minijuego ?? null
      : null;
  }

  get tieneObjetos(): boolean {
    return !!this.motor?.tieneObjetos;
  }

  get autorActual(): string {
    if (this.arteActual.personajeNombre) {
      return '';
    }
    if (this.recursoActual && instanceOfIConversacion(this.recursoActual)) {
      return (this.recursoActual as IConversacion).autorMensaje || '';
    }
    if (this.recursoActual && instanceOfIDecision(this.recursoActual)) {
      return (this.recursoActual as IDecision).autorDecisionMensaje || '';
    }
    return '';
  }

  /** El texto del nodo actual, con sus variables sustituidas por los valores de la partida. */
  get mensajeActual(): string {
    const crudo = this.mensajeCrudo();
    return this.motor ? this.motor.texto(crudo, this.estado) : crudo;
  }

  private mensajeCrudo(): string {
    if (!this.recursoActual) {
      return '';
    }
    if (instanceOfIConversacion(this.recursoActual)) {
      return (this.recursoActual as IConversacion).mensaje;
    }
    if (instanceOfIDecision(this.recursoActual)) {
      return (this.recursoActual as IDecision).decisionMensaje;
    }
    if (instanceOfIEntrada(this.recursoActual)) {
      return (this.recursoActual as IEntrada).etiqueta;
    }
    if (instanceOfIExplora(this.recursoActual)) {
      return (this.recursoActual as IExplora).mensaje || '';
    }
    if (instanceOfIJuega(this.recursoActual)) {
      return (this.recursoActual as IJuega).mensaje || '';
    }
    // La tarjeta de un final muestra su propio texto: no se repite en el cuadro de diálogo.
    return '';
  }

  get placeholderEntrada(): string {
    return this.esEntrada ? (this.recursoActual as IEntrada).placeholder : '';
  }

  get siguienteRecursoId(): string | undefined {
    if (this.recursoActual && instanceOfIConversacion(this.recursoActual)) {
      return (this.recursoActual as IConversacion).siguienteRecursoId;
    }
    return undefined;
  }

  get finDeNovela(): boolean {
    if (this.terminado) {
      return true;
    }
    if (!this.recursoActual) {
      return false;
    }
    if (this.esDecision) {
      // Todas las opciones ocultas o deshabilitadas por condición: no hay a dónde ir.
      return !this.opciones.some(o => o.habilitada);
    }
    if (this.esExplora) {
      return !this.zonas.some(z => z.habilitada);
    }
    if (this.esJuega) {
      return false;
    }
    if (this.esEntrada) {
      return false;
    }
    return !this.siguienteRecursoId;
  }

  mostrarRecurso(recurso?: MixRecursosType): void {
    this.recursoActual = recurso;
    this.presentacion++;
    this.actualizarVista();
  }

  /** Recalcula lo derivado del estado: fondo, opciones, zonas, mochila y HUD. */
  private actualizarVista(): void {
    const motor = this.motor;
    const recurso = this.recursoActual;

    // Sin un fondo propio, el nodo usa el de la ubicación donde está el jugador.
    this.arteActual = recurso
      ? this.novelaPlayerService.resolverArte(
          recurso,
          this.personajes,
          this.backgrounds,
          motor?.ubicacionDe(this.estado)?.backgroundSpriteId
        )
      : {};
    this.opciones =
      motor && recurso && instanceOfIDecision(recurso)
        ? motor.opcionesDe(recurso, this.estado)
        : [];
    this.zonas =
      motor && recurso && instanceOfIExplora(recurso)
        ? motor.zonasDe(recurso, this.estado)
        : [];
    // Durante un minijuego o en un final no se usan objetos: la historia no está en un punto donde el jugador pueda desviarse.
    const puedeUsarObjetos = !this.esJuega && !this.esTermina;
    this.mochila = motor
      ? motor.mochila(this.estado).map(item => ({
          ...item,
          imagenUrl: item.imagenUrl ? this.uploadsService.resolveUrl(item.imagenUrl) : null,
          uso: item.uso && { ...item.uso, habilitado: item.uso.habilitado && puedeUsarObjetos },
        }))
      : [];
    this.ubicacionNombre = motor?.ubicacionDe(this.estado)?.nombre ?? '';
    this.hud = motor ? motor.hud(this.estado) : [];
    this.logrosVista = motor ? motor.logros(this.estado) : [];
    this.anunciarLogros();
  }

  /** Avisa de los logros que la partida acaba de desbloquear (una sola vez cada uno). */
  private anunciarLogros(): void {
    const nuevos = this.logrosVista.filter(l => l.desbloqueado && !this.logrosAnunciados.has(l.id));
    if (!nuevos.length) {
      return;
    }

    nuevos.forEach(l => this.logrosAnunciados.add(l.id));
    this.toastLogro = `Logro desbloqueado: ${nuevos.map(l => l.nombre).join(', ')}`;
    clearTimeout(this.temporizadorToast);
    this.temporizadorToast = setTimeout(() => (this.toastLogro = ''), 4500);
  }

  siguiente(): void {
    this.avanzarA(this.siguienteRecursoId);
  }

  /** Elegir una opción de Selecciona o pulsar una zona de Explora (su id es el de la opción). */
  elegirOpcion(opcionId: string): void {
    if (
      !this.motor ||
      !this.recursoActual ||
      !(instanceOfIDecision(this.recursoActual) || instanceOfIExplora(this.recursoActual))
    ) {
      return;
    }

    const eleccion = this.motor.elegirOpcion(this.recursoActual, opcionId, this.estado);
    if (!eleccion) {
      return;
    }

    this.estado = eleccion.estado;

    if (eleccion.destinoId) {
      this.avanzarA(eleccion.destinoId);
    } else {
      // Una zona que solo cambia el estado (recoger un objeto) no cambia de nodo: se queda y se repinta.
      this.actualizarVista();
      this.guardarPartida(this.recursoActual.recursoId);
    }
  }

  /**
   * Usar un objeto de la mochila. Sus efectos se aplican y, si lleva a un nodo, la historia sigue por ahí; si no, el jugador se queda
   * donde estaba (como con una zona que solo cambia el estado) y todo se repinta.
   */
  usarObjeto(objetoId: string): void {
    if (!this.motor || !this.recursoActual || this.esJuega || this.esTermina) {
      return;
    }

    const uso = this.motor.usarObjeto(objetoId, this.estado);
    if (!uso) {
      return;
    }

    this.estado = uso.estado;

    if (uso.destinoId) {
      this.avanzarA(uso.destinoId);
    } else {
      this.actualizarVista();
      this.guardarPartida(this.recursoActual.recursoId);
    }
  }

  /**
   * Termina un minijuego: guarda el puntaje, aplica los efectos de la salida (éxito o fallo) y sigue por ella.
   * Una salida sin destino termina la historia.
   */
  terminarMinijuego(resultado: IResultadoMinijuego): void {
    if (!this.motor || !this.recursoActual || !instanceOfIJuega(this.recursoActual)) {
      return;
    }

    const eleccion = this.motor.resolverMinijuego(this.recursoActual as IJuega, resultado, this.estado);
    this.estado = eleccion.estado;

    if (eleccion.destinoId) {
      this.avanzarA(eleccion.destinoId);
    } else {
      // Como con los nodos automáticos: la partida guardada se queda en este nodo con el estado de antes,
      // para que al retomarla no se apliquen dos veces los efectos.
      this.terminado = true;
      this.actualizarVista();
    }
  }

  enviarEntrada(valor: string): void {
    if (!this.motor || !this.recursoActual || !instanceOfIEntrada(this.recursoActual)) {
      return;
    }

    const entrada = this.recursoActual as IEntrada;
    this.estado = this.motor.aplicarEntrada(entrada, valor, this.estado);
    this.avanzarA(entrada.siguienteRecursoId);
  }

  /** Estado editado desde el depurador de la vista previa; se queda en el mismo recurso. */
  reemplazarEstado(estado: IEstadoJuego): void {
    this.estado = estado;
    this.actualizarVista();
  }

  /**
   * Único punto por el que avanza la historia: el motor recorre los nodos automáticos (Evalua,
   * Asigna) y devuelve el primer recurso que hay que mostrar.
   */
  avanzarA(recursoId?: string): void {
    this.mostrarResolucion(recursoId, true);
  }

  private mostrarResolucion(recursoId: string | undefined, registrar: boolean): void {
    if (!this.motor) {
      return;
    }

    const resolucion = this.motor.resolver(recursoId, this.estado);

    if (!resolucion.recurso) {
      // Los efectos de los nodos automáticos se descartan: la partida guardada sigue en el último recurso
      // mostrado, con el estado que tenía, para que al retomarla no se apliquen dos veces.
      this.terminado = true;
      this.errorMotor = this.describirError(resolucion.error);
      this.actualizarVista();
      return;
    }

    this.estado = resolucion.estado;
    // Llegar a un final lo registra en el estado (y se guarda con la partida, junto a los logros).
    if (instanceOfITermina(resolucion.recurso)) {
      this.estado = this.motor.registrarFinal(resolucion.recurso, this.estado);
    }
    this.terminado = false;
    this.errorMotor = undefined;
    this.mostrarRecurso(resolucion.recurso);

    // Al retomar una partida no se vuelve a guardar: solo cuando el jugador avanza.
    if (registrar) {
      this.registrarProgreso(resolucion.recurso.recursoId);
    }
  }

  private describirError(error?: 'no_encontrado' | 'ciclo'): string | undefined {
    switch (error) {
      case 'ciclo':
        return 'La historia entró en un bucle sin diálogos y se detuvo.';
      case 'no_encontrado':
        return 'La historia apunta a un nodo que ya no existe.';
      default:
        return undefined;
    }
  }

  private registrarProgreso(recursoId: string): void {
    if (this.modo !== 'jugar' || !this.lecturaId) {
      return;
    }

    this.ordenActual++;
    this.lecturasService
      .postLecturaRecurso({
        lecturaId: this.lecturaId,
        recursoId,
        recursoOrder: this.ordenActual,
      })
      .subscribe();
    this.guardarPartida(recursoId);
  }

  private guardarPartida(recursoId: string): void {
    if (this.modo !== 'jugar' || !this.lecturaId) {
      return;
    }

    this.lecturasService
      .putEstado(this.lecturaId, {
        estado: this.estado,
        recursoActualId: recursoId,
        novelaVersionId: this.version?.novelaVersionId,
      })
      .subscribe();
  }
}
