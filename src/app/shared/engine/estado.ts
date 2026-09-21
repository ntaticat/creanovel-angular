import {
  IDefiniciones,
  IEstadoJuego,
  IObjetoDef,
  IVariableDef,
  VariableValor,
} from '@models/motor.interfaces';

/** Tope de unidades de un objeto apilable sin máximo propio (el mismo que valida el backend). */
export const MAX_CANTIDAD = 9999;

export function clamp(valor: number, def: IVariableDef): number {
  let resultado = valor;
  if (typeof def.min === 'number') resultado = Math.max(def.min, resultado);
  if (typeof def.max === 'number') resultado = Math.min(def.max, resultado);
  return resultado;
}

/** ¿`valor` es válido para la variable? Sirve para restaurar partidas y para aplicar entradas del jugador. */
export function esValorValido(valor: unknown, def: IVariableDef): valor is VariableValor {
  switch (def.tipo) {
    case 'numero':
      return typeof valor === 'number' && Number.isFinite(valor);
    case 'booleano':
      return typeof valor === 'boolean';
    default:
      return (
        typeof valor === 'string' &&
        (!def.valores?.length || def.valores.includes(valor))
      );
  }
}

export function valorInicial(def: IVariableDef): VariableValor {
  if (def.inicial != null && esValorValido(def.inicial, def)) {
    return def.tipo === 'numero' ? clamp(def.inicial as number, def) : def.inicial;
  }
  switch (def.tipo) {
    case 'numero':
      return clamp(0, def);
    case 'booleano':
      return false;
    default:
      return def.valores?.[0] ?? '';
  }
}

/** Máximo de unidades que se pueden tener de un objeto: 1 si no es apilable. */
export function topeObjeto(def: IObjetoDef): number {
  return def.apilable ? (def.max ?? MAX_CANTIDAD) : 1;
}

export function cantidadInicial(def: IObjetoDef): number {
  return Math.min(Math.max(0, Math.trunc(def.inicial ?? 0)), topeObjeto(def));
}

export function cantidadDe(estado: IEstadoJuego, objetoId: string): number {
  return estado.inventario?.[objetoId] ?? 0;
}

export function crearEstadoInicial(defs?: IDefiniciones | null): IEstadoJuego {
  const vars: Record<string, VariableValor> = {};
  for (const def of defs?.variables ?? []) {
    vars[def.clave] = valorInicial(def);
  }

  const inventario: Record<string, number> = {};
  for (const def of defs?.objetos ?? []) {
    const cantidad = cantidadInicial(def);
    if (cantidad > 0) inventario[def.id] = cantidad;
  }

  const inicial = defs?.ubicacionInicial;
  const ubicacion =
    inicial && defs?.ubicaciones?.some(u => u.id === inicial) ? inicial : null;

  return { vars, inventario, ubicacion, logros: [], finales: [] };
}

/** Empezar de nuevo: variables, inventario y lugar vuelven al principio, pero los logros y los finales vistos se conservan. */
export function reiniciarPartida(estado: IEstadoJuego, defs?: IDefiniciones | null): IEstadoJuego {
  return {
    ...crearEstadoInicial(defs),
    logros: [...(estado.logros ?? [])],
    finales: [...(estado.finales ?? [])],
  };
}

/** Logros que aparecen en `despues` y no estaban en `antes`, para avisar al jugador de que los desbloqueó. */
export function logrosNuevos(antes: IEstadoJuego, despues: IEstadoJuego): string[] {
  const previos = new Set(antes.logros ?? []);
  return (despues.logros ?? []).filter(id => !previos.has(id));
}

/**
 * Reconcilia una partida guardada con las definiciones actuales: conserva los valores que siguen
 * siendo válidos y cae al valor inicial para variables u objetos nuevos, borrados o que cambiaron.
 */
export function normalizarEstado(
  guardado: unknown,
  defs?: IDefiniciones | null
): IEstadoJuego {
  const estado = crearEstadoInicial(defs);
  const origen = guardado as IEstadoJuego | null | undefined;
  const vars = origen?.vars;

  if (vars && typeof vars === 'object') {
    for (const def of defs?.variables ?? []) {
      const valor = (vars as Record<string, unknown>)[def.clave];
      if (esValorValido(valor, def)) {
        estado.vars[def.clave] = def.tipo === 'numero' ? clamp(valor as number, def) : valor;
      }
    }
  }

  const inventario = origen?.inventario;
  if (inventario && typeof inventario === 'object') {
    for (const def of defs?.objetos ?? []) {
      const cantidad = (inventario as Record<string, unknown>)[def.id];
      if (typeof cantidad === 'number' && Number.isInteger(cantidad) && cantidad >= 0) {
        const acotada = Math.min(cantidad, topeObjeto(def));
        if (acotada > 0) estado.inventario![def.id] = acotada;
        else delete estado.inventario![def.id];
      }
    }
  }

  const ubicacion = origen?.ubicacion;
  if (typeof ubicacion === 'string' && defs?.ubicaciones?.some(u => u.id === ubicacion)) {
    estado.ubicacion = ubicacion;
  }

  // Solo se conservan los logros y finales que siguen existiendo en el catálogo.
  const vigentes = (guardados: unknown, catalogo?: { id: string }[]) =>
    Array.isArray(guardados)
      ? [...new Set(guardados.filter((id): id is string => typeof id === 'string' && !!catalogo?.some(c => c.id === id)))]
      : [];
  estado.logros = vigentes(origen?.logros, defs?.logros);
  estado.finales = vigentes(origen?.finales, defs?.finales);

  return estado;
}
