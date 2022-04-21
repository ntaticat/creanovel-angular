
export interface IRecursoPost {
  recursoId: string;
  escenaId: string;
  recursoTipo: string;
  siguienteRecursoId?: string;
}

export interface IRecurso {
  recursoId: string;
  escenaId: string;
}

export interface IDecision extends IRecurso {
  decisionMensaje: string;
  opciones?: IDecisionOpcion[];
  primerRecurso: boolean;
  ultimoRecurso: boolean;
}

export interface IDecisionOpcionPost {
  opcionMensaje: string;
  siguienteRecursoId?: string;
  recursoDecisionId: string;
}

export interface IDecisionOpcion {
  recursoDecisionOpcionId: string;
  opcionMensaje: string;
  siguienteRecursoId?: string;
  recursoDecisionId: string;
}

export interface IConversacion extends IRecurso {
  mensaje: string;
  siguienteRecursoId?: string;
  primerRecurso: boolean;
  ultimoRecurso: boolean;
}

export function instanceOfIConversacion(object: any): object is IConversacion {
  return object.recursoTipo === "recurso_conversacion";
}

export function instanceOfIDecision(object: any): object is IDecision {
  return object.recursoTipo === "recurso_decision";
}
