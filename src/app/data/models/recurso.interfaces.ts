export interface IRecurso {
  recursoId: string;
  escenaId: string;
  recursoTipo: string;
  siguienteRecursoId?: string;
}

export interface IDecision {
  recursoId: string;
  escenaId: string;
  recursoTipo: string;

  mensaje: string;
  opciones?: IDecisionOpcion[];
}

export interface IDecisionOpcion {
  recursoDecisionOpcionId: string;
  recursoDecisionId: string;
  opcionMensaje: string;
  siguienteRecursoId?: string;
}

export interface IConversacion {
  recursoId: string;
  escenaId: string;
  recursoTipo: string;
  mensaje: string;
  siguienteRecursoId?: string;
}

export function instanceOfIConversacion(object: any): object is IConversacion {
  return object.recursoTipo === "recurso_conversacion";
}

export function instanceOfIDecision(object: any): object is IDecision {
  return object.recursoTipo === "recurso_decision";
}
