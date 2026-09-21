import {
  esEfectoIr,
  esEfectoLogro,
  esEfectoObjeto,
  esEfectoVariable,
  IDefiniciones,
  IEfecto,
  IEfectoVariable,
  IEstadoJuego,
  IVariableDef,
  VariableValor,
} from '@models/motor.interfaces';
import { clamp, esValorValido, topeObjeto } from './estado';

/** Pasa al siguiente de los valores permitidos, dando la vuelta al final. Un valor que ya no está en la lista vuelve al primero. */
export function siguienteValor(actual: string, valores: string[]): string {
  if (!valores.length) {
    return actual;
  }
  const indice = valores.indexOf(actual);
  return valores[(indice + 1) % valores.length];
}

function aplicarEfecto(
  valorActual: VariableValor,
  efecto: IEfectoVariable,
  def: IVariableDef
): VariableValor {
  const { op, valor } = efecto;

  if (op === 'alternar') {
    return typeof valorActual === 'boolean' ? !valorActual : valorActual;
  }

  if (op === 'avanzar') {
    // Solo tiene sentido con una lista de valores (un reloj: mañana → tarde → noche → mañana).
    return def.tipo === 'texto' && def.valores?.length && typeof valorActual === 'string'
      ? siguienteValor(valorActual, def.valores)
      : valorActual;
  }

  if (op === 'fijar') {
    if (!esValorValido(valor, def)) return valorActual;
    return def.tipo === 'numero' ? clamp(valor as number, def) : valor;
  }

  // sumar / restar / multiplicar solo aplican a números.
  if (typeof valorActual !== 'number' || typeof valor !== 'number' || !Number.isFinite(valor)) {
    return valorActual;
  }

  switch (op) {
    case 'sumar':
      return clamp(valorActual + valor, def);
    case 'restar':
      return clamp(valorActual - valor, def);
    case 'multiplicar':
      return clamp(valorActual * valor, def);
    default:
      return valorActual;
  }
}

/**
 * Aplica los efectos en orden y devuelve un estado nuevo (el original no se modifica). Los números
 * se acotan a [min, max] de la variable y los objetos a [0, tope]. Un efecto inválido o que cita algo
 * inexistente se ignora: el backend ya lo rechaza al guardar.
 */
export function aplicarEfectos(
  efectos: IEfecto[] | null | undefined,
  estado: IEstadoJuego,
  defs: IDefiniciones | null | undefined
): IEstadoJuego {
  const vars = { ...estado.vars };
  const inventario = { ...(estado.inventario ?? {}) };
  const logros = [...(estado.logros ?? [])];
  let ubicacion = estado.ubicacion ?? null;

  for (const efecto of efectos ?? []) {
    if (esEfectoVariable(efecto)) {
      const def = defs?.variables.find(v => v.clave === efecto.var);
      if (def && efecto.var in vars) {
        vars[efecto.var] = aplicarEfecto(vars[efecto.var], efecto, def);
      }
    } else if (esEfectoObjeto(efecto)) {
      const def = defs?.objetos?.find(o => o.id === efecto.objeto);
      const cantidad = efecto.cantidad ?? 1;
      if (def && Number.isInteger(cantidad) && cantidad >= 1) {
        const actual = inventario[def.id] ?? 0;
        const nueva =
          efecto.op === 'dar'
            ? Math.min(topeObjeto(def), actual + cantidad)
            : efecto.op === 'quitar'
              ? Math.max(0, actual - cantidad)
              : actual;
        if (nueva > 0) inventario[def.id] = nueva;
        else delete inventario[def.id];
      }
    } else if (esEfectoIr(efecto)) {
      if (defs?.ubicaciones?.some(u => u.id === efecto.ir)) {
        ubicacion = efecto.ir;
      }
    } else if (esEfectoLogro(efecto)) {
      if (defs?.logros?.some(l => l.id === efecto.logro) && !logros.includes(efecto.logro)) {
        logros.push(efecto.logro);
      }
    }
  }

  return { vars, inventario, ubicacion, logros, finales: [...(estado.finales ?? [])] };
}
