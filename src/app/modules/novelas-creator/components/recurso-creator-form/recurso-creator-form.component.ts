import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { IEscena } from '@models/escena.interfaces';
import { IPersonaje } from '@models/personaje.interfaces';
import { IBackground } from '@models/background.interfaces';
import {
  IDefiniciones,
  ICondicion,
  IEfecto,
  IMinijuegoConfig,
  IRegion,
  IResultadoMinijuego,
  IVariableDef,
  MinijuegoTipo,
} from '@models/motor.interfaces';
import {
  IDecisionOpcion,
  instanceOfIAsigna,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
  instanceOfIEvalua,
  instanceOfIExplora,
  instanceOfIJuega,
  instanceOfITermina,
  MixRecursosType,
  RecursosEnum,
  IPersonajeEnEscena,
} from '@models/recurso.interfaces';
import { RecursosService } from '@services/recursos.service';
import { UploadsService } from '@services/uploads.service';
import { extraerErrores } from 'src/app/shared/utils/http-errors.util';
import { nombreTipoRecurso, resumenRecurso } from 'src/app/shared/utils/recurso-etiqueta.util';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { CondicionBuilderComponent } from '../condicion-builder/condicion-builder.component';
import { EfectosEditorComponent } from '../efectos-editor/efectos-editor.component';
import { IZonaEditable, ZonaEditorComponent } from '../zona-editor/zona-editor.component';
import { IPersonajeVista, vistasDePersonajes } from 'src/app/shared/services/novela-player.service';
import { PersonajesEscenarioEditorComponent } from '../personajes-escenario-editor/personajes-escenario-editor.component';
import { limitarRegion } from 'src/app/shared/utils/region.util';
import { MinijuegoComponent } from 'src/app/shared/components/minijuego/minijuego.component';
import { AyudaVariablesComponent } from 'src/app/shared/components/ayuda-variables/ayuda-variables.component';
import { describirMinijuego, NOMBRES_MINIJUEGO } from 'src/app/shared/engine/minijuegos/minijuego';
import { describirCondicion, describirEfectos } from 'src/app/shared/engine/texto';
import { TarjetaPlegableComponent } from 'src/app/shared/components/tarjeta-plegable/tarjeta-plegable.component';

const SIN_DEFINICIONES: IDefiniciones = { variables: [] };

interface ICampoMinijuego {
  control: string;
  etiqueta: string;
  min: number;
  max: number;
  paso: number;
}

/** Ajustes de cada minijuego con los mismos límites que valida el backend (MinijuegoValidador.cs). */
const CAMPOS_MINIJUEGO: Record<MinijuegoTipo, ICampoMinijuego[]> = {
  reflejo: [
    { control: 'objetivos', etiqueta: 'Objetivos', min: 1, max: 20, paso: 1 },
    { control: 'aciertosNecesarios', etiqueta: 'Aciertos necesarios', min: 1, max: 20, paso: 1 },
    { control: 'duracionMs', etiqueta: 'Tiempo de cada objetivo (ms)', min: 400, max: 10000, paso: 100 },
  ],
  precision: [
    { control: 'velocidad', etiqueta: 'Velocidad (1–10)', min: 1, max: 10, paso: 1 },
    { control: 'anchoZona', etiqueta: 'Ancho de la zona (%)', min: 5, max: 60, paso: 1 },
    { control: 'intentos', etiqueta: 'Intentos', min: 1, max: 10, paso: 1 },
  ],
  secuencia: [
    { control: 'longitud', etiqueta: 'Flechas', min: 2, max: 12, paso: 1 },
    { control: 'tiempoMs', etiqueta: 'Tiempo total (ms)', min: 1000, max: 60000, paso: 500 },
  ],
  pulsaciones: [
    { control: 'objetivo', etiqueta: 'Pulsaciones necesarias', min: 3, max: 200, paso: 1 },
    { control: 'tiempoMs', etiqueta: 'Tiempo total (ms)', min: 1000, max: 30000, paso: 500 },
  ],
};

const MINIJUEGO_POR_DEFECTO = {
  objetivos: 5,
  aciertosNecesarios: 4,
  duracionMs: 1500,
  velocidad: 5,
  anchoZona: 20,
  intentos: 3,
  longitud: 5,
  tiempoMs: 6000,
  objetivo: 20,
};
interface IRecursoOption {
  recurso: MixRecursosType;
  escenaIdentificador: string;
}

interface ISpriteOption {
  id: string;
  label: string;
}

interface ITipoRecursoOption {
  valor: RecursosEnum;
  etiqueta: string;
  descripcion: string;
}

@Component({
  selector: 'app-recurso-creator-form',
  templateUrl: './recurso-creator-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PersonajesEscenarioEditorComponent,
    TarjetaPlegableComponent,
    FaIconComponent,
    SpinnerComponent,
    CondicionBuilderComponent,
    EfectosEditorComponent,
    ZonaEditorComponent,
    MinijuegoComponent,
    AyudaVariablesComponent,
  ],
})
export class RecursoCreatorFormComponent implements OnChanges {
  @Input() escenaId: string = '';
  @Input() escenas: IEscena[] = [];
  @Input() personajes: IPersonaje[] = [];
  @Input() backgrounds: IBackground[] = [];
  /** Variables de la versión: alimentan los selects de condiciones, efectos y el nodo Pide. */
  @Input() definiciones: IDefiniciones | null | undefined;
  @Input() recursoEditar?: MixRecursosType;
  @Output() guardado = new EventEmitter<void>();

  RecursosEnum = RecursosEnum;
  guardando = false;
  errores: string[] = [];

  /** Vista de las zonas para el editor visual: se recalcula al cambiar el formulario, no en cada ciclo de detección. */
  zonasVista: IZonaEditable[] = [];
  /** El escenario de personajes se ve plegado y solo se abre para colocarlos. */
  personajesAbiertos = false;

  /** Los personajes del nodo ya resueltos para dibujarlos bajo las zonas; se recalcula al cambiarlos, no en cada ciclo de detección. */
  personajesVista: IPersonajeVista[] = [];
  /**
   * La opción (rama, zona o salida de un minijuego) que se está editando: las demás se ven plegadas, con su resumen. En un Explora es
   * también la zona elegida en el escenario, así que tocar una zona ahí abre su detalle y al revés.
   */
  opcionAbierta = -1;

  faPlus = faPlus;
  faTrash = faTrash;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;

  readonly tiposRecurso: ITipoRecursoOption[] = [
    { valor: RecursosEnum.conversacion, etiqueta: 'Habla', descripcion: 'Alguien dice algo' },
    { valor: RecursosEnum.decision, etiqueta: 'Selecciona', descripcion: 'El jugador elige una opción' },
    { valor: RecursosEnum.evalua, etiqueta: 'Evalúa', descripcion: 'Elige la ruta según las variables' },
    { valor: RecursosEnum.asigna, etiqueta: 'Asigna', descripcion: 'Cambia variables y continúa' },
    { valor: RecursosEnum.entrada, etiqueta: 'Pide', descripcion: 'El jugador escribe un valor' },
    { valor: RecursosEnum.explora, etiqueta: 'Explora', descripcion: 'Zonas clicables sobre un fondo' },
    { valor: RecursosEnum.juega, etiqueta: 'Juega', descripcion: 'Un minijuego con éxito o fallo' },
    { valor: RecursosEnum.termina, etiqueta: 'Termina', descripcion: 'Un final de la historia' },
  ];

  readonly tiposMinijuego: { valor: MinijuegoTipo; etiqueta: string }[] = [
    { valor: 'reflejo', etiqueta: `${NOMBRES_MINIJUEGO.reflejo} — pulsar objetivos a tiempo` },
    { valor: 'precision', etiqueta: `${NOMBRES_MINIJUEGO.precision} — parar el marcador en la zona` },
    { valor: 'secuencia', etiqueta: `${NOMBRES_MINIJUEGO.secuencia} — flechas en orden` },
    { valor: 'pulsaciones', etiqueta: `${NOMBRES_MINIJUEGO.pulsaciones} — machacar un botón` },
  ];

  /** Configuración del minijuego para "Probar": se recalcula al cambiar el formulario para no crear un objeto nuevo en cada ciclo. */
  configMinijuego: IMinijuegoConfig = this.configDesdeControles('reflejo', MINIJUEGO_POR_DEFECTO);
  probandoMinijuego = false;
  resultadoPrueba?: IResultadoMinijuego;

  recursoForm: UntypedFormGroup = this.fb.group({
    tipoRecurso: [RecursosEnum.conversacion, Validators.required],
    mensaje: [''],
    autor: [''],
    siguienteRecursoId: [''],
    primerRecurso: [false],
    ultimoRecurso: [false],
    personajes: [[] as IPersonajeEnEscena[]],
    backgroundSpriteId: [''],
    clave: [''],
    placeholder: [''],
    efectos: [[] as IEfecto[]],
    minijuegoTipo: ['reflejo' as MinijuegoTipo],
    variableResultado: [''],
    final: [''],
    minijuego: this.fb.group({ ...MINIJUEGO_POR_DEFECTO }),
    opciones: this.fb.array([]),
  });

  constructor(
    private fb: UntypedFormBuilder,
    private recursosService: RecursosService,
    private uploadsService: UploadsService
  ) {
    this.recursoForm
      .get('tipoRecurso')!
      .valueChanges.subscribe(() => {
        this.alCambiarTipo();
        this.aplicarValidadores();
      });
    this.recursoForm
      .get('minijuegoTipo')!
      .valueChanges.subscribe(() => this.aplicarValidadores());
    this.recursoForm.get('minijuego')!.valueChanges.subscribe(() => this.actualizarConfigMinijuego());
    this.recursoForm.get('minijuegoTipo')!.valueChanges.subscribe(() => this.actualizarConfigMinijuego());
    this.opciones.valueChanges.subscribe(() => this.actualizarZonasVista());
    this.recursoForm.get('personajes')!.valueChanges.subscribe(() => this.actualizarPersonajesVista());
    this.aplicarValidadores();
  }

  ngOnChanges(): void {
    this.buildForm();
    // También cuando cambia la biblioteca de personajes (llega después de abrir el formulario).
    this.actualizarPersonajesVista();
  }

  get opciones(): UntypedFormArray {
    return this.recursoForm.get('opciones') as UntypedFormArray;
  }

  /**
   * Se lee del propio control y no de `recursoForm.value`: dentro del `valueChanges` de un control, el valor del grupo padre
   * todavía es el anterior, y los validadores y las salidas del nuevo tipo se prepararían con el tipo viejo.
   */
  private get tipo(): RecursosEnum {
    return this.recursoForm.get('tipoRecurso')!.value;
  }

  get esConversacion(): boolean {
    return this.tipo === RecursosEnum.conversacion;
  }

  get esDecision(): boolean {
    return this.tipo === RecursosEnum.decision;
  }

  get esEvalua(): boolean {
    return this.tipo === RecursosEnum.evalua;
  }

  get esAsigna(): boolean {
    return this.tipo === RecursosEnum.asigna;
  }

  get esEntrada(): boolean {
    return this.tipo === RecursosEnum.entrada;
  }

  get esExplora(): boolean {
    return this.tipo === RecursosEnum.explora;
  }

  get esJuega(): boolean {
    return this.tipo === RecursosEnum.juega;
  }

  get esTermina(): boolean {
    return this.tipo === RecursosEnum.termina;
  }

  /** Finales del catálogo, para elegir cuál registra este nodo. */
  get finalesDefinidos() {
    return this.definiciones?.finales ?? [];
  }

  get minijuegoTipo(): MinijuegoTipo {
    return this.recursoForm.get('minijuegoTipo')!.value;
  }

  get camposMinijuego(): ICampoMinijuego[] {
    return CAMPOS_MINIJUEGO[this.minijuegoTipo] ?? [];
  }

  /** El puntaje del minijuego se guarda en una variable numérica. */
  get variablesNumericas(): IVariableDef[] {
    return this.variables.filter(v => v.tipo === 'numero');
  }

  /** Nombre de la salida de un Juega para el título de su tarjeta. */
  nombreSalida(grupo: AbstractControl): string {
    return grupo.get('tipo')?.value === 'exito' ? 'Si sale bien' : 'Si sale mal';
  }

  /** Habla, Selecciona, Pide y Explora tienen escenario: personaje y fondo. */
  get tieneEscenario(): boolean {
    return this.esPresentable || this.esExplora;
  }

  /** Habla, Selecciona y Pide se muestran al jugador; Evalúa y Asigna se resuelven solos. */
  get esPresentable(): boolean {
    return this.esConversacion || this.esDecision || this.esEntrada;
  }

  /** Selecciona, Evalúa y Explora tienen una lista editable de opciones; Juega tiene sus dos salidas fijas, aparte. */
  get tieneOpciones(): boolean {
    return this.esDecision || this.esEvalua || this.esExplora;
  }

  /** Fondo elegido, para dibujar las zonas encima. */
  get fondoUrl(): string | null {
    const id = this.recursoForm.value.backgroundSpriteId;
    for (const fondo of this.backgrounds) {
      const sprite = (fondo.sprites || []).find(s => s.backgroundSpriteId === id);
      if (sprite) {
        return this.uploadsService.resolveUrl(sprite.direccionImagen);
      }
    }
    return null;
  }

  get modoEdicion(): boolean {
    return !!this.recursoEditar;
  }

  get variables(): IVariableDef[] {
    return this.definiciones?.variables ?? [];
  }

  /** Un Pide guarda lo escrito en una variable de texto o número. */
  get variablesEntrada(): IVariableDef[] {
    return this.variables.filter(v => v.tipo !== 'booleano');
  }

  /** Lo que pueden citar condiciones y efectos. Siempre la misma referencia: un objeto nuevo en cada ciclo dispararía NG0100. */
  get definicionesActuales(): IDefiniciones {
    return this.definiciones ?? SIN_DEFINICIONES;
  }

  get tipoActual(): ITipoRecursoOption | undefined {
    return this.tiposRecurso.find(t => t.valor === this.tipo);
  }

  /** Destinos de las salidas con opciones (Selecciona, zonas, ramas, éxito/fallo): pueden volver al mismo nodo ("reintentar"). */
  get recursosDisponibles(): IRecursoOption[] {
    return this.recursosDe(() => true);
  }

  /** Destinos del "siguiente" simple de Habla, Pide, Asigna y del sino de Evalúa: un nodo que sigue a sí mismo no tendría sentido. */
  get recursosParaSiguiente(): IRecursoOption[] {
    return this.recursosDe(r => r.recursoId !== this.recursoEditar?.recursoId);
  }

  private recursosDe(incluir: (recurso: MixRecursosType) => boolean): IRecursoOption[] {
    const opciones: IRecursoOption[] = [];
    this.escenas.forEach(escena => {
      (escena.recursos || [])
        .filter(incluir)
        .forEach(recurso =>
          opciones.push({ recurso, escenaIdentificador: escena.identificador })
        );
    });
    return opciones;
  }

  get autoresSugeridos(): string[] {
    return this.personajes.map(p => p.nombre).filter(nombre => !!nombre);
  }

  resolverUrl(url: string): string {
    return this.uploadsService.resolveUrl(url);
  }

  /** Quién sale en el escenario, en una línea, para verlo con el editor plegado. */
  get resumenPersonajes(): string {
    const colocados = ((this.recursoForm.get('personajes')!.value ?? []) as IPersonajeEnEscena[]).length;
    if (!colocados) {
      return 'Ninguno: ábrelo para añadir';
    }
    const nombres = [...new Set(this.personajesVista.map(p => p.nombre))];
    return `${colocados} en escena${nombres.length ? ` · ${nombres.join(', ')}` : ''}`;
  }

  /** Los personajes que aparecen en el escenario del nodo, tal como los deja el editor visual. */
  cambiarPersonajes(personajes: IPersonajeEnEscena[]): void {
    this.recursoForm.get('personajes')!.setValue(personajes);
  }

  get backgroundSpriteOptions(): ISpriteOption[] {
    const opciones: ISpriteOption[] = [];
    this.backgrounds.forEach(b => {
      (b.sprites || []).forEach(s =>
        opciones.push({
          id: s.backgroundSpriteId,
          label: `${b.descripcion} - ${s.nombre}`,
        })
      );
    });
    return opciones;
  }

  // ---- Título y resumen de cada opción, para verla plegada

  /** Nombre corto del nodo al que lleva una salida (o `undefined` si no lleva a ninguno). */
  private destinoCorto(id: string | null | undefined): string | undefined {
    const destino = id ? this.recursosDisponibles.find(o => o.recurso.recursoId === id) : undefined;
    return destino ? this.labelRecurso(destino) : undefined;
  }

  tituloOpcion(grupo: AbstractControl, indice: number): string {
    const base = this.esEvalua ? 'Rama' : this.esExplora ? 'Zona' : 'Opción';
    const texto = String(grupo.get('opcionMensaje')?.value ?? '').replace(/\s+/g, ' ').trim();
    return `${base} ${indice + 1}${texto ? ` · ${texto.length > 40 ? `${texto.slice(0, 39).trimEnd()}…` : texto}` : ''}`;
  }

  /** Lo esencial de una opción en una línea: dónde está (zona), cuándo se toma, qué hace y a dónde lleva. */
  resumenOpcion(grupo: AbstractControl): string {
    const partes: string[] = [];
    const region = grupo.get('region')?.value as IRegion | null;
    const condicion = grupo.get('condicion')?.value as ICondicion | null;
    const efectos = (grupo.get('efectos')?.value as IEfecto[] | null) ?? [];
    const destino = this.destinoCorto(grupo.get('siguienteRecursoId')?.value);

    if (this.esExplora && region) {
      partes.push(`${region.x}% · ${region.y}% · ${region.ancho}×${region.alto}`);
    }
    if (condicion) {
      partes.push(`${this.esEvalua ? 'se toma si' : 'si'} ${describirCondicion(condicion)}`);
    }
    if (efectos.length) {
      partes.push(describirEfectos(efectos));
    }
    partes.push(
      destino
        ? `→ ${destino}`
        : this.esJuega
          ? 'la historia termina'
          : efectos.length && this.esExplora
            ? 'solo aplica los efectos'
            : this.esEvalua
              ? 'sin destino'
              : 'fin de rama'
    );
    return partes.join(' · ');
  }

  /** Qué falta en una opción para poder guardar (para avisarlo aunque esté plegada). */
  advertenciaOpcion(grupo: AbstractControl): string {
    if (grupo.get('opcionMensaje')?.invalid) return this.esExplora ? 'Falta el nombre' : 'Falta el mensaje';
    if (grupo.get('condicion')?.invalid) return 'Falta la condición';
    if (grupo.get('region')?.invalid) return 'Falta la región';
    return '';
  }

  labelRecurso(option: IRecursoOption): string {
    const texto = resumenRecurso(option.recurso).slice(0, 30);
    return `${option.escenaIdentificador} — ${nombreTipoRecurso(option.recurso)}: ${texto}`;
  }

  /**
   * Validaciones según el tipo: solo los nodos que se muestran exigen mensaje, Pide exige la variable
   * donde guarda lo escrito, y una rama de Evalúa exige condición (sin ella nunca se sabría cuándo tomarla).
   */
  private aplicarValidadores(): void {
    const requerido = (activo: boolean) => (activo ? [Validators.required] : []);

    this.recursoForm.get('mensaje')!.setValidators(requerido(this.esPresentable));
    this.recursoForm.get('clave')!.setValidators(requerido(this.esEntrada));
    this.recursoForm.get('final')!.setValidators(requerido(this.esTermina));
    this.recursoForm.get('final')!.updateValueAndValidity({ emitEvent: false });
    this.recursoForm.get('mensaje')!.updateValueAndValidity({ emitEvent: false });
    this.recursoForm.get('clave')!.updateValueAndValidity({ emitEvent: false });

    // Solo los ajustes del minijuego elegido validan su rango: los demás quedan ocultos y no deben bloquear el guardado.
    const grupoMinijuego = this.recursoForm.get('minijuego')!;
    for (const [tipo, campos] of Object.entries(CAMPOS_MINIJUEGO)) {
      for (const campo of campos) {
        const control = grupoMinijuego.get(campo.control)!;
        const activo = this.esJuega && tipo === this.minijuegoTipo;
        control.setValidators(
          activo ? [Validators.required, Validators.min(campo.min), Validators.max(campo.max)] : []
        );
        control.updateValueAndValidity({ emitEvent: false });
      }
    }

    this.opciones.controls.forEach(grupo => {
      grupo.get('opcionMensaje')!.setValidators(requerido(this.esDecision || this.esExplora));
      grupo.get('condicion')!.setValidators(requerido(this.esEvalua));
      grupo.get('region')!.setValidators(requerido(this.esExplora));
      grupo.get('opcionMensaje')!.updateValueAndValidity({ emitEvent: false });
      grupo.get('condicion')!.updateValueAndValidity({ emitEvent: false });
      grupo.get('region')!.updateValueAndValidity({ emitEvent: false });
    });
  }

  /** Al pasar a Juega se preparan sus dos salidas; al dejarlo se descartan las opciones del tipo anterior. */
  private alCambiarTipo(): void {
    if (this.esJuega) {
      this.opciones.clear();
      this.opciones.push(this.nuevaOpcion({ tipo: 'exito' } as IDecisionOpcion));
      this.opciones.push(this.nuevaOpcion({ tipo: 'fallo' } as IDecisionOpcion));
      // Al crear un minijuego se ve la primera salida para rellenarla; al editar uno ya hecho, todo plegado.
      this.opcionAbierta = this.modoEdicion ? -1 : 0;
    } else if (this.opciones.length && this.opciones.controls.every(g => ['exito', 'fallo'].includes(g.get('tipo')?.value))) {
      this.opciones.clear();
      this.opcionAbierta = -1;
    }
    this.probandoMinijuego = false;
    this.resultadoPrueba = undefined;
  }

  private configDesdeControles(tipo: MinijuegoTipo, v: Record<string, number>): IMinijuegoConfig {
    switch (tipo) {
      case 'precision':
        return { tipo, velocidad: v['velocidad'], anchoZona: v['anchoZona'], intentos: v['intentos'] };
      case 'secuencia':
        return { tipo, longitud: v['longitud'], tiempoMs: v['tiempoMs'] };
      case 'pulsaciones':
        return { tipo, objetivo: v['objetivo'], tiempoMs: v['tiempoMs'] };
      default:
        return { tipo: 'reflejo', objetivos: v['objetivos'], aciertosNecesarios: v['aciertosNecesarios'], duracionMs: v['duracionMs'] };
    }
  }

  private actualizarConfigMinijuego(): void {
    this.configMinijuego = this.configDesdeControles(this.minijuegoTipo, this.recursoForm.get('minijuego')!.value);
  }

  get descripcionMinijuego(): string {
    return describirMinijuego(this.configMinijuego);
  }

  probarMinijuego(): void {
    this.resultadoPrueba = undefined;
    this.probandoMinijuego = true;
  }

  terminarPrueba(resultado: IResultadoMinijuego): void {
    this.resultadoPrueba = resultado;
    this.probandoMinijuego = false;
  }

  private nuevaOpcion(datos?: IDecisionOpcion): UntypedFormGroup {
    const grupo = this.fb.group({
      id: [datos?.recursoDecisionOpcionId ?? null],
      tipo: [datos?.tipo ?? 'opcion'],
      opcionMensaje: [datos?.opcionMensaje ?? ''],
      siguienteRecursoId: [datos?.siguienteRecursoId || ''],
      condicion: [datos?.condicion ?? null],
      condicionModo: [datos?.condicionModo ?? 'ocultar'],
      efectos: [datos?.efectos ?? []],
      region: [datos?.region ?? null],
    });
    return grupo;
  }

  private actualizarPersonajesVista(): void {
    this.personajesVista = vistasDePersonajes(
      (this.recursoForm.get('personajes')!.value ?? []) as IPersonajeEnEscena[],
      this.personajes,
      url => this.uploadsService.resolveUrl(url)
    );
  }

  private actualizarZonasVista(): void {
    this.zonasVista = this.opciones.controls.map(grupo => ({
      etiqueta: grupo.value.opcionMensaje ?? '',
      region: (grupo.value.region as IRegion | null) ?? null,
    }));
  }

  private buildForm() {
    const recurso = this.recursoEditar;

    this.opciones.clear();
    this.errores = [];
    this.opcionAbierta = -1;
    this.personajesAbiertos = false;
    this.probandoMinijuego = false;
    this.resultadoPrueba = undefined;

    const vacio = {
      tipoRecurso: RecursosEnum.conversacion,
      mensaje: '',
      autor: '',
      siguienteRecursoId: '',
      primerRecurso: false,
      ultimoRecurso: false,
      personajes: [],
      backgroundSpriteId: '',
      clave: '',
      placeholder: '',
      efectos: [],
      minijuegoTipo: 'reflejo' as MinijuegoTipo,
      variableResultado: '',
      final: '',
      minijuego: { ...MINIJUEGO_POR_DEFECTO },
    };

    if (!recurso) {
      this.recursoForm.reset(vacio);
      this.aplicarValidadores();
      this.actualizarConfigMinijuego();
      return;
    }

    const comunes = {
      primerRecurso: recurso.primerRecurso,
      ultimoRecurso: recurso.ultimoRecurso,
      personajes: recurso.personajes ?? [],
      backgroundSpriteId: recurso.backgroundSpriteId || '',
    };

    if (instanceOfIConversacion(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.conversacion,
        mensaje: recurso.mensaje,
        autor: recurso.autorMensaje || '',
        siguienteRecursoId: recurso.siguienteRecursoId || '',
      });
    } else if (instanceOfIDecision(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.decision,
        mensaje: recurso.decisionMensaje,
        autor: recurso.autorDecisionMensaje || '',
      });
      this.cargarOpciones(recurso.opciones);
    } else if (instanceOfIEvalua(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.evalua,
        siguienteRecursoId: recurso.siguienteRecursoId || '',
      });
      this.cargarOpciones(recurso.opciones);
    } else if (instanceOfIAsigna(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.asigna,
        siguienteRecursoId: recurso.siguienteRecursoId || '',
        efectos: recurso.efectos ?? [],
      });
    } else if (instanceOfIExplora(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.explora,
        mensaje: recurso.mensaje || '',
      });
      this.cargarOpciones(recurso.opciones);
    } else if (instanceOfITermina(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.termina,
        mensaje: recurso.mensaje || '',
        final: recurso.final || '',
      });
    } else if (instanceOfIJuega(recurso)) {
      const config = recurso.minijuego;
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.juega,
        mensaje: recurso.mensaje || '',
        variableResultado: recurso.variableResultado || '',
        minijuegoTipo: config?.tipo ?? 'reflejo',
        minijuego: { ...MINIJUEGO_POR_DEFECTO, ...(config ? this.sinTipo(config) : {}) },
      });
      // `reset` dispara el cambio de tipo, que prepara dos salidas vacías: se descartan y se cargan las guardadas.
      this.opciones.clear();
      // Las dos salidas, en orden, aunque falte alguna (una versión dañada no debe dejar el formulario inservible).
      for (const tipo of ['exito', 'fallo'] as const) {
        const existente = (recurso.opciones ?? []).find(o => o.tipo === tipo);
        this.opciones.push(this.nuevaOpcion(existente ?? ({ tipo } as IDecisionOpcion)));
      }
    } else if (instanceOfIEntrada(recurso)) {
      this.recursoForm.reset({
        ...vacio,
        ...comunes,
        tipoRecurso: RecursosEnum.entrada,
        mensaje: recurso.etiqueta,
        clave: recurso.clave,
        placeholder: recurso.placeholder || '',
        siguienteRecursoId: recurso.siguienteRecursoId || '',
      });
    }

    this.aplicarValidadores();
    this.actualizarConfigMinijuego();
  }

  private sinTipo(config: IMinijuegoConfig): Record<string, number> {
    const { tipo: _tipo, ...ajustes } = config;
    return ajustes as Record<string, number>;
  }

  private cargarOpciones(opciones?: IDecisionOpcion[]) {
    [...(opciones ?? [])]
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .forEach(opcion => this.opciones.push(this.nuevaOpcion(opcion)));
  }

  agregarOpcion() {
    this.opciones.push(this.nuevaOpcion());
    this.aplicarValidadores();
    this.opcionAbierta = this.opciones.length - 1;   // la nueva se abre para rellenarla y las demás se pliegan
  }

  quitarOpcion(index: number) {
    this.opciones.removeAt(index);
    if (this.opcionAbierta === index) {
      this.opcionAbierta = -1;
    } else if (this.opcionAbierta > index) {
      this.opcionAbierta--;   // sigue siendo la misma opción, una posición antes
    }
  }

  /** Abrir o cerrar el detalle de una opción; abrir una cierra la que estaba abierta. */
  fijarOpcion(indice: number, abierta: boolean) {
    if (abierta) {
      this.opcionAbierta = indice;
    } else if (this.opcionAbierta === indice) {
      this.opcionAbierta = -1;
    }
  }

  /** El orden importa: es el que ve el jugador en Selecciona y el de evaluación en Evalúa. */
  /** Zona dibujada en el escenario: se agrega con un nombre provisional y queda seleccionada. */
  agregarZona(region: IRegion) {
    const grupo = this.nuevaOpcion();
    grupo.patchValue({ opcionMensaje: `Zona ${this.opciones.length + 1}`, region });
    this.opciones.push(grupo);
    this.aplicarValidadores();
    this.opcionAbierta = this.opciones.length - 1;
  }

  cambiarRegionZona(indice: number, region: IRegion) {
    const grupo = this.opciones.at(indice);
    if (grupo) {
      grupo.patchValue({ region: limitarRegion(region) });
      grupo.markAsDirty();
    }
  }

  /** Edición numérica de la región (alternativa accesible a arrastrar con el ratón). */
  cambiarCampoRegion(grupo: AbstractControl, campo: keyof IRegion, texto: string) {
    const valor = Number(texto);
    const actual = grupo.get('region')?.value as IRegion | null;
    if (!actual || texto.trim() === '' || !Number.isFinite(valor)) {
      return;
    }
    // Cambiar el tamaño no debe desplazar la zona: el ancho y el alto se recortan a lo que cabe desde x e y.
    const limite = campo === 'ancho' ? 100 - actual.x : campo === 'alto' ? 100 - actual.y : Infinity;
    grupo.patchValue({ region: limitarRegion({ ...actual, [campo]: Math.min(valor, limite) }) });
    grupo.markAsDirty();
  }

  seleccionarZona(indice: number) {
    this.opcionAbierta = indice;
  }

  moverOpcion(index: number, delta: -1 | 1) {
    const destino = index + delta;
    if (destino < 0 || destino >= this.opciones.length) {
      return;
    }
    const grupo = this.opciones.at(index);
    this.opciones.removeAt(index);
    this.opciones.insert(destino, grupo);
    // La opción abierta se queda abierta aunque cambie de sitio (y la que ocupaba su lugar no cambia de estado).
    if (this.opcionAbierta === index) {
      this.opcionAbierta = destino;
    } else if (this.opcionAbierta === destino) {
      this.opcionAbierta = index;
    }
  }

  cambiarCondicion(grupo: AbstractControl, condicion: ICondicion | null) {
    grupo.patchValue({ condicion });
    grupo.markAsDirty();
  }

  cambiarEfectosOpcion(grupo: AbstractControl, efectos: IEfecto[]) {
    grupo.patchValue({ efectos });
    grupo.markAsDirty();
  }

  cambiarEfectos(efectos: IEfecto[]) {
    this.recursoForm.patchValue({ efectos });
    this.recursoForm.markAsDirty();
  }

  onSubmit() {
    if (!this.recursoForm.valid || this.guardando) {
      this.recursoForm.markAllAsTouched();
      // Lo que falta puede estar en una opción plegada: se abre la primera incompleta para que se vea.
      const incompleta = this.opciones.controls.findIndex(grupo => grupo.invalid);
      if (incompleta >= 0) {
        this.opcionAbierta = incompleta;
      }
      return;
    }
    const minijuego = this.recursoForm.get('minijuego')!.value;
    if (this.esJuega && this.minijuegoTipo === 'reflejo' && minijuego.aciertosNecesarios > minijuego.objetivos) {
      this.errores = ['Los aciertos necesarios no pueden superar el número de objetivos.'];
      return;
    }

    this.guardando = true;
    this.errores = [];

    const value = this.recursoForm.value;
    const guardar$ =
      this.modoEdicion && this.recursoEditar
        ? this.actualizarRecurso(value)
        : this.crearRecurso(value);

    guardar$.subscribe({
      next: () => this.finalizarGuardado(),
      error: error => {
        this.guardando = false;
        this.errores = extraerErrores(error, 'No se pudo guardar el recurso.');
      },
    });
  }

  private crearRecurso(value: any): Observable<unknown> {
    const base = {
      escenaId: this.escenaId,
      primerRecurso: value.primerRecurso,
      ultimoRecurso: value.ultimoRecurso,
    };
    const visual = {
      personajes: (value.personajes ?? []) as IPersonajeEnEscena[],
      backgroundSpriteId: value.backgroundSpriteId || undefined,
    };
    const siguiente = value.siguienteRecursoId || undefined;

    switch (value.tipoRecurso as RecursosEnum) {
      case RecursosEnum.decision:
        return this.recursosService
          .postRecursoDecision({
            ...base,
            ...visual,
            tipoRecurso: RecursosEnum.decision,
            decisionMensaje: value.mensaje,
            autorDecisionMensaje: value.autor || undefined,
          })
          .pipe(switchMap(id => this.crearOpciones(id, value.opciones)));

      case RecursosEnum.evalua:
        return this.recursosService
          .postRecurso({
            ...base,
            tipoRecurso: RecursosEnum.evalua,
            siguienteRecursoId: siguiente ?? null,
          })
          .pipe(switchMap(id => this.crearOpciones(id, value.opciones)));

      case RecursosEnum.asigna:
        return this.recursosService.postRecurso({
          ...base,
          tipoRecurso: RecursosEnum.asigna,
          siguienteRecursoId: siguiente ?? null,
          contenido: { efectos: value.efectos ?? [] },
        });

      case RecursosEnum.explora:
        return this.recursosService
          .postRecurso({
            ...base,
            tipoRecurso: RecursosEnum.explora,
            personajes: visual.personajes,
            backgroundSpriteId: visual.backgroundSpriteId ?? null,
            contenido: { mensaje: value.mensaje ?? '' },
          })
          .pipe(switchMap(id => this.crearOpciones(id, value.opciones)));

      case RecursosEnum.termina:
        return this.recursosService.postRecurso({
          ...base,
          tipoRecurso: RecursosEnum.termina,
          contenido: { final: value.final, mensaje: value.mensaje ?? '' },
        });

      case RecursosEnum.juega:
        return this.recursosService
          .postRecurso({
            ...base,
            tipoRecurso: RecursosEnum.juega,
            contenido: this.contenidoJuega(value),
          })
          .pipe(switchMap(id => this.crearOpciones(id, value.opciones)));

      case RecursosEnum.entrada:
        return this.recursosService.postRecursoEntrada({
          ...base,
          ...visual,
          tipoRecurso: RecursosEnum.entrada,
          etiqueta: value.mensaje,
          clave: value.clave,
          valor: '',
          placeholder: value.placeholder || '',
          siguienteRecursoId: siguiente,
        });

      default:
        return this.recursosService.postRecursoConversacion({
          ...base,
          ...visual,
          tipoRecurso: RecursosEnum.conversacion,
          mensaje: value.mensaje,
          autorMensaje: value.autor || undefined,
          siguienteRecursoId: siguiente,
        });
    }
  }

  private actualizarRecurso(value: any): Observable<unknown> {
    const recursoId = this.recursoEditar!.recursoId;
    const base = {
      primerRecurso: value.primerRecurso,
      ultimoRecurso: value.ultimoRecurso,
    };
    const visual = {
      personajes: (value.personajes ?? []) as IPersonajeEnEscena[],
      backgroundSpriteId: value.backgroundSpriteId || undefined,
    };
    const siguiente = value.siguienteRecursoId || undefined;

    switch (value.tipoRecurso as RecursosEnum) {
      case RecursosEnum.decision:
        return this.recursosService
          .patchRecursoDecision(recursoId, {
            ...base,
            ...visual,
            decisionMensaje: value.mensaje,
            autorDecisionMensaje: value.autor || undefined,
          } as any)
          .pipe(switchMap(() => this.sincronizarOpciones(recursoId, value.opciones)));

      case RecursosEnum.evalua:
        return this.recursosService
          .patchRecurso(recursoId, { ...base, siguienteRecursoId: siguiente ?? null })
          .pipe(switchMap(() => this.sincronizarOpciones(recursoId, value.opciones)));

      case RecursosEnum.asigna:
        return this.recursosService.patchRecurso(recursoId, {
          ...base,
          siguienteRecursoId: siguiente ?? null,
          contenido: { efectos: value.efectos ?? [] },
        });

      case RecursosEnum.explora:
        return this.recursosService
          .patchRecurso(recursoId, {
            ...base,
            personajes: visual.personajes,
            backgroundSpriteId: visual.backgroundSpriteId ?? null,
            contenido: { mensaje: value.mensaje ?? '' },
          })
          .pipe(switchMap(() => this.sincronizarOpciones(recursoId, value.opciones)));

      case RecursosEnum.termina:
        return this.recursosService.patchRecurso(recursoId, {
          ...base,
          contenido: { final: value.final, mensaje: value.mensaje ?? '' },
        });

      case RecursosEnum.juega:
        return this.recursosService
          .patchRecurso(recursoId, { ...base, contenido: this.contenidoJuega(value) })
          .pipe(switchMap(() => this.sincronizarOpciones(recursoId, value.opciones)));

      case RecursosEnum.entrada:
        return this.recursosService.patchRecursoEntrada(recursoId, {
          ...base,
          ...visual,
          etiqueta: value.mensaje,
          clave: value.clave,
          placeholder: value.placeholder || '',
          siguienteRecursoId: siguiente,
        });

      default:
        return this.recursosService.patchRecursoConversacion(recursoId, {
          ...base,
          ...visual,
          mensaje: value.mensaje,
          autorMensaje: value.autor || undefined,
          siguienteRecursoId: siguiente,
        } as any);
    }
  }

  private contenidoJuega(value: any) {
    return {
      mensaje: value.mensaje ?? '',
      variableResultado: value.variableResultado || null,
      minijuego: this.configDesdeControles(value.minijuegoTipo, value.minijuego),
    };
  }

  /** Campos de una opción/rama tal como los espera el backend. `orden` es la posición en el formulario. */
  private cuerpoOpcion(opcion: any, orden: number) {
    return {
      opcionMensaje: opcion.opcionMensaje ?? '',
      siguienteRecursoId: opcion.siguienteRecursoId || undefined,
      orden,
      condicion: (opcion.condicion ?? null) as ICondicion | null,
      condicionModo: opcion.condicionModo,
      efectos: opcion.efectos?.length ? opcion.efectos : null,
      region: (opcion.region ?? null) as IRegion | null,
      // Las salidas de un Juega se distinguen por su tipo (exito/fallo); en los demás recursos lo decide el servidor.
      ...(opcion.tipo === 'exito' || opcion.tipo === 'fallo' ? { tipo: opcion.tipo as 'exito' | 'fallo' } : {}),
    };
  }

  private crearOpciones(
    recursoDecisionId: string,
    opciones: any[]
  ): Observable<unknown> {
    if (!opciones.length) {
      return of(null);
    }

    return forkJoin(
      opciones.map((opcion, orden) =>
        this.recursosService.postRecursoOpcion({
          ...this.cuerpoOpcion(opcion, orden),
          recursoDecisionId,
        })
      )
    );
  }

  private sincronizarOpciones(
    recursoDecisionId: string,
    opciones: any[]
  ): Observable<unknown> {
    const idsOriginales =
      (this.recursoEditar as any)?.opciones?.map(
        (o: any) => o.recursoDecisionOpcionId
      ) || [];
    const idsActuales = opciones.filter(o => o.id).map(o => o.id);
    const idsAEliminar = idsOriginales.filter(
      (id: string) => !idsActuales.includes(id)
    );

    const operaciones = [
      ...opciones.map((opcion, orden) =>
        opcion.id
          ? this.recursosService.patchRecursoOpcion(
              opcion.id,
              this.cuerpoOpcion(opcion, orden)
            )
          : this.recursosService.postRecursoOpcion({
              ...this.cuerpoOpcion(opcion, orden),
              recursoDecisionId,
            })
      ),
      ...idsAEliminar.map((id: string) =>
        this.recursosService.deleteRecursoOpcion(id)
      ),
    ];

    return operaciones.length ? forkJoin(operaciones) : of(null);
  }

  private finalizarGuardado() {
    this.guardando = false;
    this.guardado.emit();
  }
}
