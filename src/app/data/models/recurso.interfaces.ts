import { CondicionModo, ICondicion, IEfecto, IMinijuegoConfig, IRegion } from './motor.interfaces';

/**
 * Un personaje colocado en el escenario de un nodo. `x` e `y` son el centro del sprite en % del escenario (16:9); `escala` multiplica
 * el tamaño base (el sprite entero cabe en el escenario, sin recortarse); `espejo` lo voltea. El orden de la lista es el de apilado.
 */
export interface IPersonajeEnEscena {
  personajeSpriteId: string;
  x: number;
  y: number;
  escala: number;
  espejo: boolean;
}

export interface IRecurso {
  recursoId: string;
  escenaId: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
  tipoRecurso: string;
  /** Personajes que aparecen en el escenario del nodo, de atrás hacia delante. */
  personajes?: IPersonajeEnEscena[];
  backgroundSpriteId?: string;
}

export interface IDecision extends IRecurso {
  decisionMensaje: string;
  autorDecisionMensaje?: string;
  opciones?: IDecisionOpcion[];
}

export interface IDecisionOpcionPost {
  opcionMensaje: string;
  siguienteRecursoId?: string | null;
  recursoDecisionId: string;
  orden?: number;
  condicion?: ICondicion | null;
  condicionModo?: CondicionModo;
  efectos?: IEfecto[] | null;
  region?: IRegion | null;
  /** Solo al crear la salida de un Juega: 'exito' o 'fallo'. En los demás recursos lo decide el servidor. */
  tipo?: 'exito' | 'fallo';
}

/** Salida de un recurso con varias ramas: opción de un Selecciona o rama de un Evalua. */
export interface IDecisionOpcion {
  recursoDecisionOpcionId: string;
  opcionMensaje: string;
  siguienteRecursoId?: string;
  recursoDecisionId: string;
  orden: number;
  /** 'opcion' (Selecciona), 'rama' (Evalúa), 'zona' (Explora) o 'exito' / 'fallo' (las dos salidas de un Juega). */
  tipo: 'opcion' | 'rama' | 'zona' | 'exito' | 'fallo';
  condicion?: ICondicion | null;
  condicionModo: CondicionModo;
  efectos?: IEfecto[] | null;
  /** Solo en zonas de un Explora. */
  region?: IRegion | null;
}

/** Termina: un final de la historia. `final` es el id de un final del catálogo; `mensaje` es un texto opcional. */
export interface ITermina extends IRecurso {
  final: string;
  mensaje: string;
}

/** Juega: un minijuego con dos salidas (opciones `exito` y `fallo`). `variableResultado` recibe el puntaje. */
export interface IJuega extends IRecurso {
  mensaje: string;
  variableResultado?: string | null;
  minijuego?: IMinijuegoConfig | null;
  opciones?: IDecisionOpcion[];
}

/** Explora: fondo con zonas clicables. Cada zona es una opción con `region`; `mensaje` es un texto opcional sobre el escenario. */
export interface IExplora extends IRecurso {
  mensaje: string;
  opciones?: IDecisionOpcion[];
}

/** Evalua: gana la primera rama que se cumple; `siguienteRecursoId` es el "sino". */
export interface IEvalua extends IRecurso {
  siguienteRecursoId?: string;
  opciones?: IDecisionOpcion[];
}

/** Asigna: aplica efectos al estado y continúa. */
export interface IAsigna extends IRecurso {
  efectos: IEfecto[];
  siguienteRecursoId?: string;
}

/** Cuerpo de POST/PATCH /recursos (tipos con contenido validado por el motor). */
export interface IRecursoGenericoPost {
  escenaId: string;
  tipoRecurso: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
  siguienteRecursoId?: string | null;
  personajes?: IPersonajeEnEscena[];
  backgroundSpriteId?: string | null;
  /** Asigna: `{ efectos }`. Explora: `{ mensaje }`. */
  contenido?:
    | { efectos: IEfecto[] }
    | { mensaje: string }
    | { mensaje: string; variableResultado?: string | null; minijuego: IMinijuegoConfig }
    | { final: string; mensaje: string }
    | null;
}

export interface IConversacion extends IRecurso {
  mensaje: string;
  autorMensaje?: string;
  siguienteRecursoId?: string;
}

export interface IEntrada extends IRecurso {
  etiqueta: string;
  clave: string;
  valor: string;
  placeholder: string;
  siguienteRecursoId?: string;
}

export interface IRecursoConversacionPost {
  escenaId: string;
  tipoRecurso: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
  mensaje: string;
  autorMensaje?: string;
  siguienteRecursoId?: string;
  personajes?: IPersonajeEnEscena[];
  backgroundSpriteId?: string;
}

export interface IRecursoDecisionPost {
  escenaId: string;
  tipoRecurso: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
  decisionMensaje: string;
  autorDecisionMensaje?: string;
  personajes?: IPersonajeEnEscena[];
  backgroundSpriteId?: string;
}

export interface IRecursoEntradaPost {
  escenaId: string;
  tipoRecurso: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
  etiqueta: string;
  clave: string;
  valor: string;
  placeholder: string;
  siguienteRecursoId?: string;
  personajes?: IPersonajeEnEscena[];
  backgroundSpriteId?: string;
}

export function instanceOfIConversacion(
  object: MixRecursosType
): object is IConversacion {
  return object.tipoRecurso === RecursosEnum.conversacion;
}

export function instanceOfIDecision(
  object: MixRecursosType
): object is IDecision {
  return object.tipoRecurso === RecursosEnum.decision;
}

export function instanceOfIEntrada(
  object: MixRecursosType
): object is IEntrada {
  return object.tipoRecurso === RecursosEnum.entrada;
}

export function instanceOfIEvalua(
  object: MixRecursosType
): object is IEvalua {
  return object.tipoRecurso === RecursosEnum.evalua;
}

export function instanceOfIAsigna(
  object: MixRecursosType
): object is IAsigna {
  return object.tipoRecurso === RecursosEnum.asigna;
}

export function instanceOfIExplora(
  object: MixRecursosType
): object is IExplora {
  return object.tipoRecurso === RecursosEnum.explora;
}

export function instanceOfIJuega(
  object: MixRecursosType
): object is IJuega {
  return object.tipoRecurso === RecursosEnum.juega;
}

export function instanceOfITermina(
  object: MixRecursosType
): object is ITermina {
  return object.tipoRecurso === RecursosEnum.termina;
}

export type MixRecursosType =
  | IConversacion
  | IDecision
  | IEntrada
  | IEvalua
  | IAsigna
  | IExplora
  | IJuega
  | ITermina;

export enum RecursosEnum {
  conversacion = 'recurso_conversacion',
  decision = 'recurso_decision',
  entrada = 'recurso_entrada',
  evalua = 'recurso_evalua',
  asigna = 'recurso_asigna',
  explora = 'recurso_explora',
  juega = 'recurso_juega',
  termina = 'recurso_termina',
}
