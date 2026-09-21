import {
  IDecision,
  IDecisionOpcion,
  IEntrada,
  IExplora,
  IJuega,
  ITermina,
  instanceOfIAsigna,
  instanceOfIEvalua,
  instanceOfIExplora,
  MixRecursosType,
} from '@models/recurso.interfaces';
import {
  IDefiniciones,
  IEstadoJuego,
  IMetaDef,
  IRegion,
  IResultadoMinijuego,
  IUbicacionDef,
  VariableValor,
} from '@models/motor.interfaces';
import { evaluarCondicion } from './condiciones';
import { interpolar } from './interpolacion';
import { aplicarEfectos } from './efectos';
import { cantidadDe, crearEstadoInicial, esValorValido, clamp } from './estado';

/** Tope de nodos automáticos (Evalua/Asigna) seguidos: corta bucles que nunca llegan a un diálogo. */
export const MAX_PASOS_AUTOMATICOS = 200;

export interface IOpcionJuego {
  id: string;
  mensaje: string;
  habilitada: boolean;
}

/** Una zona clicable de un Explora que el jugador puede ver ahora mismo. `id` es el de su opción. */
export interface IZonaJuego {
  id: string;
  etiqueta: string;
  region: IRegion;
  habilitada: boolean;
}

/** Un objeto que el jugador tiene. */
export interface IItemMochila {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string | null;
  cantidad: number;
  apilable: boolean;
  /** Presente si el objeto se puede usar. `habilitado` es falso si su condición no se cumple ahora mismo. */
  uso?: { etiqueta: string; habilitado: boolean; llevaANodo: boolean };
}

/** Recursos cuyas salidas son opciones con condición y efectos. */
export type IConOpciones = IDecision | IExplora;

/** Un logro del catálogo con su estado en esta partida. */
export interface ILogroVista {
  id: string;
  nombre: string;
  descripcion: string;
  desbloqueado: boolean;
}

/** Cuántos finales del catálogo se han visto. */
export interface IResumenFinales {
  descubiertos: number;
  total: number;
}

/** Lo que se muestra al llegar a un final. */
export interface IFinalVista {
  titulo: string;
  mensaje: string;
  descubiertos: number;
  total: number;
}

export interface IHudItem {
  clave: string;
  etiqueta: string;
  tipo: 'numero' | 'barra';
  valor: VariableValor;
  min?: number;
  max?: number;
}

export interface IResolucion {
  estado: IEstadoJuego;
  /** Primer recurso "presentable" (Habla/Selecciona/Pide). Ausente cuando no queda nada por mostrar. */
  recurso?: MixRecursosType;
  /** La historia terminó sin llegar a un recurso presentable. */
  fin: boolean;
  error?: 'no_encontrado' | 'ciclo';
}

export interface IEleccion {
  estado: IEstadoJuego;
  destinoId?: string;
}

const porOrden = (a: IDecisionOpcion, b: IDecisionOpcion) => (a.orden ?? 0) - (b.orden ?? 0);

/**
 * Intérprete de la historia: dado un recurso y el estado, avanza por los nodos automáticos
 * (Evalua, Asigna) aplicando sus reglas hasta llegar a algo que el jugador ve. No conoce Angular
 * ni HTTP; el player solo pide "resuelve este id" y pinta el resultado.
 */
export class NovelaMotor {
  constructor(
    private readonly recursos: Map<string, MixRecursosType>,
    readonly defs: IDefiniciones
  ) {}

  estadoInicial(): IEstadoJuego {
    return crearEstadoInicial(this.defs);
  }

  resolver(recursoId: string | undefined, estado: IEstadoJuego): IResolucion {
    let actualId = recursoId;
    let actual = estado;

    for (let paso = 0; paso <= MAX_PASOS_AUTOMATICOS; paso++) {
      if (!actualId) {
        return { estado: actual, fin: true };
      }

      const recurso = this.recursos.get(actualId);
      if (!recurso) {
        return { estado: actual, fin: true, error: 'no_encontrado' };
      }

      if (instanceOfIAsigna(recurso)) {
        actual = aplicarEfectos(recurso.efectos, actual, this.defs);
        actualId = recurso.siguienteRecursoId;
      } else if (instanceOfIEvalua(recurso)) {
        const rama = (recurso.opciones ?? [])
          .filter(o => o.tipo === 'rama')
          .sort(porOrden)
          .find(o => evaluarCondicion(o.condicion, actual));

        if (rama) {
          actual = aplicarEfectos(rama.efectos, actual, this.defs);
          actualId = rama.siguienteRecursoId;
        } else {
          actualId = recurso.siguienteRecursoId;
        }
      } else {
        return { estado: actual, recurso, fin: false };
      }
    }

    return { estado: actual, fin: true, error: 'ciclo' };
  }

  /** Opciones que el jugador ve: las ocultas por condición se omiten, las "deshabilitar" salen inactivas. */
  opcionesDe(decision: IDecision, estado: IEstadoJuego): IOpcionJuego[] {
    return [...(decision.opciones ?? [])]
      .sort(porOrden)
      .flatMap(opcion => {
        const cumple = evaluarCondicion(opcion.condicion, estado);

        if (!cumple && opcion.condicionModo !== 'deshabilitar') {
          return [];
        }

        return [
          {
            id: opcion.recursoDecisionOpcionId,
            mensaje: this.texto(opcion.opcionMensaje, estado),
            habilitada: cumple && !!opcion.siguienteRecursoId,
          },
        ];
      });
  }

  /** Zonas de un Explora que el jugador ve: las ocultas por condición se omiten, las "deshabilitar" salen inactivas. */
  zonasDe(explora: IExplora, estado: IEstadoJuego): IZonaJuego[] {
    return [...(explora.opciones ?? [])]
      .filter(o => o.tipo === 'zona' && !!o.region)
      .sort(porOrden)
      .flatMap(zona => {
        const cumple = evaluarCondicion(zona.condicion, estado);

        if (!cumple && zona.condicionModo !== 'deshabilitar') {
          return [];
        }

        return [
          {
            id: zona.recursoDecisionOpcionId,
            etiqueta: this.texto(zona.opcionMensaje, estado),
            region: zona.region!,
            // Una zona que solo cambia el estado (recoger un objeto) no necesita destino para poder pulsarse.
            habilitada: cumple && (!!zona.siguienteRecursoId || !!zona.efectos?.length),
          },
        ];
      });
  }

  /** Aplica los efectos de la opción o zona elegida. Devuelve `undefined` si no existe o no está disponible. */
  elegirOpcion(
    decision: IConOpciones,
    opcionId: string,
    estado: IEstadoJuego
  ): IEleccion | undefined {
    const opcion = (decision.opciones ?? []).find(
      o => o.recursoDecisionOpcionId === opcionId
    );

    if (!opcion || !evaluarCondicion(opcion.condicion, estado)) {
      return undefined;
    }

    return {
      estado: aplicarEfectos(opcion.efectos, estado, this.defs),
      destinoId: opcion.siguienteRecursoId,
    };
  }

  /**
   * Cierra un nodo Juega: guarda el puntaje en su variable (si tiene), aplica los efectos de la salida que corresponde
   * al resultado (éxito o fallo) y devuelve a dónde sigue la historia.
   */
  resolverMinijuego(juega: IJuega, resultado: IResultadoMinijuego, estado: IEstadoJuego): IEleccion {
    let actual = estado;
    const variable = this.defs.variables.find(v => v.clave === juega.variableResultado);

    if (variable && variable.tipo === 'numero' && variable.clave in estado.vars) {
      actual = { ...actual, vars: { ...actual.vars, [variable.clave]: clamp(resultado.puntaje, variable) } };
    }

    const salida = (juega.opciones ?? []).find(o => o.tipo === (resultado.exito ? 'exito' : 'fallo'));
    if (!salida) {
      return { estado: actual };
    }

    return { estado: aplicarEfectos(salida.efectos, actual, this.defs), destinoId: salida.siguienteRecursoId };
  }

  /** Guarda lo que escribió el jugador en la variable de un nodo Pide. Un valor inválido no cambia el estado. */
  aplicarEntrada(entrada: IEntrada, valor: string, estado: IEstadoJuego): IEstadoJuego {
    const def = this.defs.variables.find(v => v.clave === entrada.clave);
    if (!def || !(def.clave in estado.vars)) {
      return estado;
    }

    let convertido: unknown = valor.trim();
    if (def.tipo === 'numero') {
      convertido = valor.trim() === '' ? NaN : Number(valor);
    }

    if (!esValorValido(convertido, def)) {
      return estado;
    }

    return {
      ...estado,
      vars: {
        ...estado.vars,
        [def.clave]: def.tipo === 'numero' ? clamp(convertido as number, def) : (convertido as VariableValor),
      },
    };
  }

  hud(estado: IEstadoJuego): IHudItem[] {
    return this.defs.variables
      .filter(def => def.hud !== 'oculto' && def.clave in estado.vars)
      .map(def => ({
        clave: def.clave,
        etiqueta: def.etiqueta || def.clave,
        tipo: def.hud === 'barra' && def.tipo === 'numero' ? 'barra' : 'numero',
        valor: estado.vars[def.clave],
        min: def.min ?? undefined,
        max: def.max ?? undefined,
      }));
  }

  /** ¿Puede el jugador salir de esta decisión o exploración? Si no, la historia se quedó sin camino. */
  hayOpcionDisponible(recurso: IConOpciones, estado: IEstadoJuego): boolean {
    return instanceOfIExplora(recurso)
      ? this.zonasDe(recurso, estado).some(z => z.habilitada)
      : this.opcionesDe(recurso, estado).some(o => o.habilitada);
  }

  /** Un texto del autor con sus variables sustituidas por los valores de esta partida. */
  texto(texto: string, estado: IEstadoJuego): string {
    return interpolar(texto, estado, this.defs);
  }

  /** Registra el final alcanzado. Ver un final por segunda vez no lo duplica. */
  registrarFinal(termina: ITermina, estado: IEstadoJuego): IEstadoJuego {
    const visto = estado.finales ?? [];
    return this.defs.finales?.some(f => f.id === termina.final) && !visto.includes(termina.final)
      ? { ...estado, finales: [...visto, termina.final] }
      : estado;
  }

  finalDe(termina: ITermina): IMetaDef | undefined {
    return this.defs.finales?.find(f => f.id === termina.final);
  }

  resumenFinales(estado: IEstadoJuego): IResumenFinales {
    const catalogo = this.defs.finales ?? [];
    const vistos = estado.finales ?? [];
    return { descubiertos: catalogo.filter(f => vistos.includes(f.id)).length, total: catalogo.length };
  }

  get tieneLogros(): boolean {
    return (this.defs.logros?.length ?? 0) > 0;
  }

  logros(estado: IEstadoJuego): ILogroVista[] {
    const conseguidos = estado.logros ?? [];
    return (this.defs.logros ?? []).map(l => ({
      id: l.id,
      nombre: l.nombre || l.id,
      descripcion: l.descripcion,
      desbloqueado: conseguidos.includes(l.id),
    }));
  }

  get tieneObjetos(): boolean {
    return (this.defs.objetos?.length ?? 0) > 0;
  }

  /** Lo que el jugador lleva encima, en el orden en que se definieron los objetos. */
  mochila(estado: IEstadoJuego): IItemMochila[] {
    return (this.defs.objetos ?? []).flatMap(def => {
      const cantidad = cantidadDe(estado, def.id);
      return cantidad > 0
        ? [
            {
              id: def.id,
              nombre: def.nombre || def.id,
              descripcion: def.descripcion,
              imagenUrl: def.imagenUrl,
              cantidad,
              apilable: def.apilable,
              uso: def.uso
                ? {
                    etiqueta: def.uso.etiqueta || 'Usar',
                    habilitado: evaluarCondicion(def.uso.condicion, estado),
                    llevaANodo: !!def.uso.destinoRecursoId,
                  }
                : undefined,
            },
          ]
        : [];
    });
  }

  /**
   * Usa un objeto de la mochila: gasta una unidad si es consumible, aplica sus efectos y devuelve a dónde sigue la historia (si lleva
   * a un nodo). `undefined` si no existe, no se tiene, no se puede usar o su condición no se cumple.
   */
  usarObjeto(objetoId: string, estado: IEstadoJuego): IEleccion | undefined {
    const uso = this.defs.objetos?.find(o => o.id === objetoId)?.uso;

    if (!uso || cantidadDe(estado, objetoId) < 1 || !evaluarCondicion(uso.condicion, estado)) {
      return undefined;
    }

    // Primero se gasta y luego se aplican los efectos: así un efecto puede devolver otro objeto (una botella vacía).
    const consumido = uso.consumir
      ? aplicarEfectos([{ objeto: objetoId, op: 'quitar', cantidad: 1 }], estado, this.defs)
      : estado;

    return {
      estado: aplicarEfectos(uso.efectos, consumido, this.defs),
      destinoId: uso.destinoRecursoId ?? undefined,
    };
  }

  ubicacionDe(estado: IEstadoJuego): IUbicacionDef | undefined {
    return this.defs.ubicaciones?.find(u => u.id === estado.ubicacion);
  }
}
