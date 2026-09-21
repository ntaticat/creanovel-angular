import { IDefiniciones } from '@models/motor.interfaces';
import { IAsigna, IConversacion, IDecision, IDecisionOpcion, IEvalua, IExplora, IJuega } from '@models/recurso.interfaces';
import { IMinijuegoConfig } from '@models/motor.interfaces';

export const DEFS: IDefiniciones = {
  variables: [
    { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', inicial: 90, min: 0, max: 100, valores: [], hud: 'barra' },
    { clave: 'afecto', etiqueta: 'Afecto', tipo: 'numero', inicial: 0, min: null, max: null, valores: [], hud: 'numero' },
    { clave: 'tiene_pareja', etiqueta: 'Pareja', tipo: 'booleano', inicial: false, valores: [], hud: 'oculto' },
    { clave: 'tiempo', etiqueta: 'Tiempo', tipo: 'texto', inicial: 'mañana', valores: ['mañana', 'tarde', 'noche'], hud: 'oculto' },
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', inicial: '', valores: [], hud: 'oculto' },
  ],
  objetos: [
    { id: 'llave', nombre: 'Llave', descripcion: 'Abre la puerta', apilable: false, inicial: 0 },
    { id: 'moneda', nombre: 'Moneda', descripcion: '', apilable: true, max: 99, inicial: 3 },
    { id: 'pocion', nombre: 'Poción', descripcion: '', apilable: true, max: null, inicial: 0 },
  ],
  ubicaciones: [
    { id: 'biblioteca', nombre: 'Biblioteca' },
    { id: 'patio', nombre: 'Patio' },
  ],
  ubicacionInicial: 'biblioteca',
  logros: [
    { id: 'valiente', nombre: 'Valiente', descripcion: 'Superaste un peligro' },
    { id: 'curioso', nombre: 'Curioso', descripcion: '' },
  ],
  finales: [
    { id: 'bueno', nombre: 'Final bueno', descripcion: '' },
    { id: 'malo', nombre: 'Final malo', descripcion: '' },
  ],
};

let contador = 0;
const id = (prefijo: string) => `${prefijo}-${++contador}`;

const base = { escenaId: 'e', primerRecurso: false, ultimoRecurso: false };

export function habla(recursoId: string, siguienteRecursoId?: string): IConversacion {
  return { ...base, recursoId, tipoRecurso: 'recurso_conversacion', mensaje: recursoId, siguienteRecursoId };
}

export function opcion(
  recursoDecisionId: string,
  parcial: Partial<IDecisionOpcion> & { orden: number }
): IDecisionOpcion {
  return {
    recursoDecisionOpcionId: id('op'),
    opcionMensaje: `opción ${parcial.orden}`,
    recursoDecisionId,
    tipo: 'opcion',
    condicionModo: 'ocultar',
    ...parcial,
  };
}

export function selecciona(recursoId: string, opciones: Partial<IDecisionOpcion>[]): IDecision {
  return {
    ...base,
    recursoId,
    tipoRecurso: 'recurso_decision',
    decisionMensaje: '¿Qué haces?',
    opciones: opciones.map((o, i) => opcion(recursoId, { orden: i, ...o })),
  };
}

export function evalua(recursoId: string, ramas: Partial<IDecisionOpcion>[], sino?: string): IEvalua {
  return {
    ...base,
    recursoId,
    tipoRecurso: 'recurso_evalua',
    siguienteRecursoId: sino,
    opciones: ramas.map((r, i) => opcion(recursoId, { orden: i, tipo: 'rama', ...r })),
  };
}

export function explora(recursoId: string, zonas: Partial<IDecisionOpcion>[]): IExplora {
  return {
    ...base,
    recursoId,
    tipoRecurso: 'recurso_explora',
    mensaje: '',
    opciones: zonas.map((z, i) =>
      opcion(recursoId, { orden: i, tipo: 'zona', region: { x: 10, y: 10, ancho: 20, alto: 20 }, ...z })
    ),
  };
}

export function juega(
  recursoId: string,
  salidas: { exito?: Partial<IDecisionOpcion>; fallo?: Partial<IDecisionOpcion> },
  extra: Partial<IJuega> = {}
): IJuega {
  const minijuego: IMinijuegoConfig = { tipo: 'pulsaciones', objetivo: 5, tiempoMs: 3000 };
  return {
    ...base,
    recursoId,
    tipoRecurso: 'recurso_juega',
    mensaje: '¡Rápido!',
    minijuego,
    ...extra,
    opciones: [
      ...(salidas.exito ? [opcion(recursoId, { orden: 0, tipo: 'exito', ...salidas.exito })] : []),
      ...(salidas.fallo ? [opcion(recursoId, { orden: 1, tipo: 'fallo', ...salidas.fallo })] : []),
    ],
  };
}

export function asigna(recursoId: string, efectos: IAsigna['efectos'], siguienteRecursoId?: string): IAsigna {
  return { ...base, recursoId, tipoRecurso: 'recurso_asigna', efectos, siguienteRecursoId };
}
