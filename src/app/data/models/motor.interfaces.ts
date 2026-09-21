/**
 * Contrato del motor de juego: variables definidas por versión, condiciones y efectos.
 * Espeja lo que valida el backend (Application/Motor/MotorValidador.cs): un AST cerrado,
 * nunca texto evaluable.
 */
export type VariableTipo = 'numero' | 'booleano' | 'texto';
export type VariableHud = 'oculto' | 'numero' | 'barra';
export type VariableValor = number | boolean | string;

export interface IVariableDef {
  clave: string;
  etiqueta: string;
  tipo: VariableTipo;
  inicial?: VariableValor | null;
  min?: number | null;
  max?: number | null;
  /** Valores permitidos de una variable de texto (vacío = libre). */
  valores: string[];
  hud: VariableHud;
}

/** Un objeto del inventario. Un no apilable se tiene o no (0 o 1); un apilable admite `max` (sin tope si es null). */
export interface IObjetoDef {
  id: string;
  nombre: string;
  descripcion: string;
  /** Archivo subido a la plataforma (`/uploads/objetos/...`). */
  imagenUrl?: string | null;
  apilable: boolean;
  max?: number | null;
  inicial: number;
  /** Ausente si el objeto no se puede usar desde la mochila. */
  uso?: IUsoObjeto | null;
}

/**
 * Lo que ocurre al usar un objeto desde la mochila. Se gasta una unidad si `consumir` (antes de aplicar los efectos, que pueden
 * devolver otro objeto) y, si hay `destinoRecursoId`, la historia salta a ese nodo. `condicion` decide cuándo se puede usar.
 */
export interface IUsoObjeto {
  /** Texto del botón ("Usar", "Beber"...). */
  etiqueta: string;
  condicion?: ICondicion | null;
  efectos?: IEfecto[] | null;
  consumir: boolean;
  destinoRecursoId?: string | null;
}

/** Un lugar del mundo; su fondo (sprite de un fondo de la novela) se usa en los nodos que no traen uno propio. */
export interface IUbicacionDef {
  id: string;
  nombre: string;
  backgroundSpriteId?: string | null;
}

/** Un logro o un final del catálogo. Su progreso vive en el estado de la partida y sobrevive a "Empezar de nuevo". */
export interface IMetaDef {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface IDefiniciones {
  variables: IVariableDef[];
  /** Ausentes en versiones anteriores a los objetos y ubicaciones. */
  objetos?: IObjetoDef[];
  ubicaciones?: IUbicacionDef[];
  ubicacionInicial?: string | null;
  logros?: IMetaDef[];
  finales?: IMetaDef[];
}

/** Configuración de un minijuego (nodo Juega). Los límites que impone el backend están en MinijuegoValidador.cs. */
export interface IMinijuegoReflejo {
  tipo: 'reflejo';
  /** Objetivos que aparecen de uno en uno (1–20). */
  objetivos: number;
  /** Cuántos hay que acertar para ganar (1–objetivos). */
  aciertosNecesarios: number;
  /** Cuánto tiempo está visible cada objetivo, en ms (400–10000). */
  duracionMs: number;
}
export interface IMinijuegoPrecision {
  tipo: 'precision';
  /** Velocidad del marcador (1–10). */
  velocidad: number;
  /** Ancho de la zona objetivo, en % de la barra (5–60). */
  anchoZona: number;
  /** Veces que se puede parar el marcador (1–10). */
  intentos: number;
}
export interface IMinijuegoSecuencia {
  tipo: 'secuencia';
  /** Flechas a pulsar en orden (2–12). */
  longitud: number;
  /** Tiempo total, en ms (1000–60000). */
  tiempoMs: number;
}
export interface IMinijuegoPulsaciones {
  tipo: 'pulsaciones';
  /** Pulsaciones necesarias (3–200). */
  objetivo: number;
  /** Tiempo total, en ms (1000–30000). */
  tiempoMs: number;
}
export type IMinijuegoConfig =
  | IMinijuegoReflejo
  | IMinijuegoPrecision
  | IMinijuegoSecuencia
  | IMinijuegoPulsaciones;
export type MinijuegoTipo = IMinijuegoConfig['tipo'];

/** Cómo terminó un minijuego. `puntaje` es lo que recibe la variable de resultado del nodo. */
export interface IResultadoMinijuego {
  exito: boolean;
  puntaje: number;
}

/** Zona clicable de un Explora: rectángulo en % del escenario. */
export interface IRegion {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export type OpComparacion = '==' | '!=' | '>' | '>=' | '<' | '<=';

export interface ICondicionComparacion {
  var: string;
  op: OpComparacion;
  valor: VariableValor;
}
/** La cantidad que se tiene de un objeto se compara con un entero: `{ objeto: 'llave', op: '>=', valor: 1 }`. */
export interface ICondicionObjeto {
  objeto: string;
  op: OpComparacion;
  valor: number;
}
/** El jugador está en esa ubicación. */
export interface ICondicionEn {
  en: string;
}
/** Ya desbloqueó ese logro (en esta partida o en anteriores). */
export interface ICondicionLogro {
  logro: string;
}
/** Ya vio ese final (en esta partida o en anteriores). */
export interface ICondicionFinal {
  final: string;
}
export interface ICondicionY {
  y: ICondicion[];
}
export interface ICondicionO {
  o: ICondicion[];
}
export interface ICondicionNo {
  no: ICondicion;
}
export type ICondicion =
  | ICondicionComparacion
  | ICondicionObjeto
  | ICondicionEn
  | ICondicionLogro
  | ICondicionFinal
  | ICondicionY
  | ICondicionO
  | ICondicionNo;

/** `avanzar` pasa a la siguiente entre los valores permitidos de una variable de texto, dando la vuelta (mañana → tarde → noche → mañana). */
export type OpEfecto = 'fijar' | 'sumar' | 'restar' | 'multiplicar' | 'alternar' | 'avanzar';

export interface IEfectoVariable {
  var: string;
  op: OpEfecto;
  valor?: VariableValor;
}
/** Da o quita objetos; `cantidad` es 1 si se omite. */
export interface IEfectoObjeto {
  objeto: string;
  op: 'dar' | 'quitar';
  cantidad?: number;
}
/** Cambia la ubicación del jugador. */
export interface IEfectoIr {
  ir: string;
}
/** Desbloquea un logro. */
export interface IEfectoLogro {
  logro: string;
}
export type IEfecto = IEfectoVariable | IEfectoObjeto | IEfectoIr | IEfectoLogro;

/** Qué hace una opción de Selecciona cuando su condición no se cumple. */
export type CondicionModo = 'ocultar' | 'deshabilitar';

/** Estado de una partida. Es lo que se guarda en Lectura.estado. */
export interface IEstadoJuego {
  vars: Record<string, VariableValor>;
  /** Cantidad de cada objeto que se tiene (solo los que se tienen). Ausente en partidas anteriores. */
  inventario?: Record<string, number>;
  /** Id de la ubicación actual. */
  ubicacion?: string | null;
  /** Logros desbloqueados. Junto con `finales`, es progreso que no se pierde al empezar de nuevo. */
  logros?: string[];
  /** Finales vistos. */
  finales?: string[];
}

export interface IValidacionIssue {
  codigo: string;
  mensaje: string;
  recursoId?: string | null;
}

export interface IValidacionVersion {
  valida: boolean;
  errores: IValidacionIssue[];
  advertencias: IValidacionIssue[];
}

export function instanceOfComparacion(c: ICondicion): c is ICondicionComparacion {
  return 'var' in c;
}
export function instanceOfCondicionObjeto(c: ICondicion): c is ICondicionObjeto {
  return 'objeto' in c;
}
export function instanceOfCondicionEn(c: ICondicion): c is ICondicionEn {
  return 'en' in c;
}
export function instanceOfCondicionLogro(c: ICondicion): c is ICondicionLogro {
  return 'logro' in c;
}
export function instanceOfCondicionFinal(c: ICondicion): c is ICondicionFinal {
  return 'final' in c;
}
export function esEfectoLogro(e: IEfecto): e is IEfectoLogro {
  return 'logro' in e;
}
export function esEfectoVariable(e: IEfecto): e is IEfectoVariable {
  return 'var' in e;
}
export function esEfectoObjeto(e: IEfecto): e is IEfectoObjeto {
  return 'objeto' in e;
}
export function esEfectoIr(e: IEfecto): e is IEfectoIr {
  return 'ir' in e;
}
export function instanceOfCondicionY(c: ICondicion): c is ICondicionY {
  return 'y' in c;
}
export function instanceOfCondicionO(c: ICondicion): c is ICondicionO {
  return 'o' in c;
}
export function instanceOfCondicionNo(c: ICondicion): c is ICondicionNo {
  return 'no' in c;
}
