import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { NgStyle } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowRight, faBagShopping, faCompress, faExpand, faEye, faEyeSlash, faLocationDot, faTrophy, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IFinalVista, IHudItem, IItemMochila, ILogroVista, IOpcionJuego, IZonaJuego } from 'src/app/shared/engine/motor';
import { IMinijuegoConfig, IResultadoMinijuego } from '@models/motor.interfaces';
import { MinijuegoComponent } from 'src/app/shared/components/minijuego/minijuego.component';
import { IPersonajeVista, IRecursoArte } from 'src/app/shared/services/novela-player.service';
import { estiloSpriteEscenario } from 'src/app/shared/utils/sprite-escenario.util';

/**
 * Full-bleed, dark "visual novel" stage: background + character layers, a
 * bottom-anchored dialogue box, and an overlay for decisions. Pulled out of
 * the signup wizard's look (which had its own hand-rolled, partly-unwired
 * version of this) so it can be driven by real player data — arte/opciones
 * come from NovelaPlayerService like the reader already uses — and reused
 * anywhere a novela needs to be staged: today testing-novela's preview,
 * later playing-novela and the creator's own preview panel.
 */
@Component({
  selector: 'app-novela-stage',
  templateUrl: './novela-stage.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgStyle, FaIconComponent, MinijuegoComponent],
})
export class NovelaStageComponent implements OnInit, OnDestroy {
  @Input() arte: IRecursoArte = {};
  @Input() autor = '';
  @Input() mensaje = '';
  @Input() esDecision = false;
  @Input() opciones: IOpcionJuego[] = [];
  @Input() mostrarSiguiente = false;
  /** Texto del botón de avanzar (el último paso del signup dice "Iniciar sesión"). */
  @Input() etiquetaSiguiente = 'Siguiente';
  /**
   * Un nodo con personajes colocados fija el escenario en 16:9 para verse como en el editor. Quien compone la escena él mismo
   * (el signup) no lo necesita y prefiere el formato alto en móvil, donde caben las opciones y el teclado.
   */
  @Input() formatoLibre = false;
  @Input() finDeNovela = false;
  /** Variables visibles (stats) que se dibujan sobre el escenario. */
  @Input() hud: IHudItem[] = [];
  /** Nodo Pide: muestra un campo de texto con esta etiqueta en lugar del cuadro de diálogo. */
  @Input() esEntrada = false;
  @Input() placeholderEntrada = '';
  /** Tipo del campo de un Pide: `password` lo enmascara (el signup pide una contraseña). */
  @Input() tipoEntrada: 'text' | 'email' | 'password' = 'text';
  @Input() autocompletarEntrada = 'off';
  /** Lo que el campo de un Pide muestra al aparecer (p. ej. lo que el jugador escribió antes y hay que corregir). */
  @Input() valorEntradaInicial = '';

  /** Nodo Explora: zonas clicables sobre el fondo. Emiten su id por `opcionSeleccionada`. */
  @Input() esExplora = false;
  @Input() zonas: IZonaJuego[] = [];
  /** Las zonas arrancan resaltadas (vista previa del autor) en lugar de invisibles. */
  @Input() resaltarZonasInicial = false;
  @Input() ubicacionNombre = '';
  @Input() mostrarMochila = false;
  @Input() mochila: IItemMochila[] = [];
  /** Muestra el botón de pantalla completa (los reproductores lo piden; el signup no). */
  @Input() permitirPantallaCompleta = false;

  /** Nodo Juega: se juega el minijuego a pantalla completa sobre el escenario. */
  @Input() minijuego: IMinijuegoConfig | null = null;
  /**
   * Cambia cada vez que se presenta un nodo. Un "reintentar" vuelve al mismo Juega con la misma configuración:
   * sin una clave distinta el minijuego no se reiniciaría.
   */
  @Input() minijuegoClave = 0;

  /** Un nodo Termina: se muestra la tarjeta del final, con el progreso de finales y la opción de empezar de nuevo. */
  @Input() final: IFinalVista | null = null;
  @Input() mostrarLogros = false;
  @Input() logros: ILogroVista[] = [];
  /** Aviso breve de un logro recién desbloqueado (vacío = ninguno). */
  @Input() toastLogro = '';

  @Output() empezarDeNuevo = new EventEmitter<void>();
  @Output() siguiente = new EventEmitter<void>();
  @Output() minijuegoTerminado = new EventEmitter<IResultadoMinijuego>();
  /** Emite el id de la opción elegida (recursoDecisionOpcionId), no su destino: el player debe aplicar sus efectos. */
  @Output() opcionSeleccionada = new EventEmitter<string>();
  /** El jugador pulsó el botón de uso de un objeto de la mochila (id del objeto). */
  @Output() objetoUsado = new EventEmitter<string>();
  @Output() entradaEnviada = new EventEmitter<string>();

  faArrowRight = faArrowRight;
  faBagShopping = faBagShopping;
  faLocationDot = faLocationDot;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faXmark = faXmark;
  faExpand = faExpand;
  faCompress = faCompress;
  faTrophy = faTrophy;
  logrosAbierto = false;

  get logrosDesbloqueados(): number {
    return this.logros.filter(l => l.desbloqueado).length;
  }

  resaltarZonas = false;
  mochilaAbierta = false;
  /**
   * La ubicación y los stats se dibujan sobre el fondo y los personajes: el jugador puede ocultarlos para ver el
   * escenario completo. Es del componente (no de cada nodo), así que se conserva mientras dura la partida.
   */
  hudVisible = true;

  /**
   * Pantalla completa: el escenario, su mochila y el botón de avanzar ocupan toda la ventana. Se pide la API nativa
   * (esconde la barra del navegador) y, en el móvil, se gira a horizontal; donde no existe (iPhone) el mismo diseño
   * se logra con una capa fija, y `Esc` o el botón la cierran.
   */
  pantallaCompleta = false;
  /** Estamos en pantalla completa nativa del navegador (y no solo en la capa fija). */
  private pantallaCompletaNativa = false;
  /** Se está en un móvil en pantalla completa pero el navegador no dejó fijar la orientación: se pide girarlo a mano. */
  sugerirGirar = false;
  private orientacionBloqueada = false;

  @ViewChild('raiz', { static: true }) private raiz!: ElementRef<HTMLElement>;

  async alternarPantallaCompleta(): Promise<void> {
    if (this.pantallaCompleta) {
      await this.salirDePantallaCompleta();
    } else {
      await this.entrarEnPantallaCompleta();
    }
  }

  private async entrarEnPantallaCompleta(): Promise<void> {
    this.pantallaCompleta = true;

    try {
      await this.raiz.nativeElement.requestFullscreen?.();
      this.pantallaCompletaNativa = !!document.fullscreenElement;
    } catch {
      // Sin permiso o sin soporte: queda la capa fija.
    }

    // La orientación solo se puede fijar en pantalla completa, y solo tiene sentido en un móvil o una tablet.
    if (this.pantallaCompletaNativa && esTactil()) {
      try {
        await orientacion()?.lock?.('landscape');
        this.orientacionBloqueada = true;
      } catch {
        // No soportado (p. ej. Firefox) o denegado.
      }
    }
    this.sugerirGirar = esTactil() && !this.orientacionBloqueada;
  }

  private async salirDePantallaCompleta(): Promise<void> {
    this.pantallaCompleta = false;
    this.sugerirGirar = false;

    if (this.orientacionBloqueada) {
      orientacion()?.unlock?.();
      this.orientacionBloqueada = false;
    }

    if (this.pantallaCompletaNativa) {
      this.pantallaCompletaNativa = false;
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ya se había salido.
        }
      }
    }
  }

  /** El jugador salió con `Esc` o el gesto del navegador: se limpia el estado sin volver a pedir la salida. */
  @HostListener('document:fullscreenchange')
  alCambiarPantallaCompleta(): void {
    if (this.pantallaCompleta && this.pantallaCompletaNativa && !document.fullscreenElement) {
      void this.salirDePantallaCompleta();
    }
  }

  /** En la capa fija (sin API nativa) no hay un `Esc` del navegador que la cierre. */
  @HostListener('document:keydown.escape')
  alPulsarEscape(): void {
    if (this.pantallaCompleta && !this.pantallaCompletaNativa) {
      void this.salirDePantallaCompleta();
    }
  }

  ngOnDestroy(): void {
    // Si se navega estando en pantalla completa no debe quedar el navegador (ni la orientación) atrapado.
    if (this.pantallaCompleta) {
      void this.salirDePantallaCompleta();
    }
  }

  get claseRaiz(): string {
    return this.pantallaCompleta
      ? 'fixed inset-0 z-[100] w-full bg-black overflow-hidden flex flex-col'
      : 'relative w-full bg-black overflow-hidden flex flex-col';
  }

  /** En pantalla completa este marco ocupa lo que dejan libre la mochila y el botón de avanzar, y centra el escenario. */
  get claseMarco(): string {
    return this.pantallaCompleta ? 'flex-1 min-h-0 [container-type:size] flex items-center justify-center' : 'w-full';
  }

  get hayHud(): boolean {
    return this.hud.length > 0 || !!this.ubicacionNombre;
  }

  alternarHud(): void {
    this.hudVisible = !this.hudVisible;
  }

  /** Lo que se dibuja en la ficha de un objeto sin imagen. */
  inicial(item: IItemMochila): string {
    return (item.nombre.trim().charAt(0) || '?').toUpperCase();
  }

  descripcionCorta(item: IItemMochila): string {
    return item.apilable ? `${item.nombre} ×${item.cantidad}` : item.nombre;
  }

  ngOnInit(): void {
    this.resaltarZonas = this.resaltarZonasInicial;
  }

  /** Un Explora fija la proporción: sus zonas están en % del escenario y solo coinciden con el fondo si se ve igual que en el editor. */
  get claseEscenario(): string {
    const fijo = this.pantallaCompleta || this.esExplora || (!this.formatoLibre && !!this.arte.personajes?.length);
    return fijo ? 'aspect-video' : 'aspect-[4/5] sm:aspect-video';
  }

  /** En pantalla completa, lo más grande que quepa en el marco sin salirse de 16:9 (unidades del contenedor: ancho y alto del marco). */
  get anchoEscenario(): string {
    return this.pantallaCompleta ? 'w-[min(100cqw,calc(100cqh*16/9))]' : 'w-full';
  }

  claseZona(zona: IZonaJuego): string {
    const relleno = this.resaltarZonas
      ? 'border-yellow-300 bg-yellow-200/20'
      : 'border-transparent';
    const interaccion = zona.habilitada
      ? 'hover:border-yellow-300 hover:bg-yellow-200/10'
      : `opacity-50 cursor-not-allowed ${this.resaltarZonas ? 'border-dashed' : ''}`;
    return `${relleno} ${interaccion}`;
  }

  usarObjeto(item: IItemMochila): void {
    if (!item.uso?.habilitado) {
      return;
    }

    this.objetoUsado.emit(item.id);

    // Si lleva a otro nodo el jugador quiere verlo: la mochila se cierra sola.
    if (item.uso.llevaANodo) {
      this.mochilaAbierta = false;
    }
  }

  /** El campo de un Pide toma el foco al aparecer: quien lo ve quiere escribir (y en el móvil sale el teclado). */
  @ViewChild('campo')
  set campoEntrada(campo: ElementRef<HTMLInputElement> | undefined) {
    campo?.nativeElement.focus();
  }

  get totalObjetos(): number {
    return this.mochila.reduce((total, item) => total + item.cantidad, 0);
  }

  get nombrePersonaje(): string {
    return this.autor || this.arte.personajeNombre || '';
  }

  porcentaje(item: IHudItem): number {
    const min = item.min ?? 0;
    const max = item.max ?? 100;
    if (typeof item.valor !== 'number' || max <= min) {
      return 0;
    }
    return Math.min(100, Math.max(0, ((item.valor - min) / (max - min)) * 100));
  }

  /** Cómo se dibuja cada personaje colocado (ver `estiloSpriteEscenario`). */
  estiloPersonaje(personaje: IPersonajeVista): Record<string, string> {
    return estiloSpriteEscenario(personaje);
  }
}

function esTactil(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

/** `lock`/`unlock` no están en los tipos del DOM de todas las versiones de TypeScript. */
function orientacion(): (ScreenOrientation & { lock?(o: string): Promise<void>; unlock?(): void }) | undefined {
  return typeof screen === 'undefined' ? undefined : screen.orientation;
}
