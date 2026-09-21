import {
  ICondicion,
  IEstadoJuego,
  instanceOfComparacion,
  instanceOfCondicionEn,
  instanceOfCondicionFinal,
  instanceOfCondicionLogro,
  instanceOfCondicionNo,
  instanceOfCondicionO,
  instanceOfCondicionObjeto,
  instanceOfCondicionY,
  OpComparacion,
  VariableValor,
} from '@models/motor.interfaces';
import { cantidadDe } from './estado';

function comparar(actual: VariableValor, op: OpComparacion, esperado: VariableValor): boolean {
  if (typeof actual !== typeof esperado) {
    return false;
  }

  if (op === '==') return actual === esperado;
  if (op === '!=') return actual !== esperado;

  // Los operadores de orden solo tienen sentido entre números.
  if (typeof actual !== 'number' || typeof esperado !== 'number') {
    return false;
  }

  switch (op) {
    case '>':
      return actual > esperado;
    case '>=':
      return actual >= esperado;
    case '<':
      return actual < esperado;
    case '<=':
      return actual <= esperado;
    default:
      return false;
  }
}

/**
 * Evalúa el AST de una condición contra el estado. `null`/`undefined` significa "sin condición" y
 * se cumple. Una condición mal formada, o que cita una variable inexistente, no se cumple: el
 * backend ya las rechaza al guardar, esto solo evita que una versión vieja rompa la partida.
 */
export function evaluarCondicion(
  condicion: ICondicion | null | undefined,
  estado: IEstadoJuego
): boolean {
  if (condicion == null) {
    return true;
  }

  if (instanceOfCondicionY(condicion)) {
    return (
      Array.isArray(condicion.y) &&
      condicion.y.length > 0 &&
      condicion.y.every(c => evaluarCondicion(c, estado))
    );
  }

  if (instanceOfCondicionO(condicion)) {
    return Array.isArray(condicion.o) && condicion.o.some(c => evaluarCondicion(c, estado));
  }

  if (instanceOfCondicionNo(condicion)) {
    return !evaluarCondicion(condicion.no, estado);
  }

  if (instanceOfComparacion(condicion)) {
    const actual = estado.vars[condicion.var];
    return actual !== undefined && comparar(actual, condicion.op, condicion.valor);
  }

  if (instanceOfCondicionObjeto(condicion)) {
    // No tener un objeto es tener 0: "tiene la llave" es `>= 1` y "no la tiene" es `== 0`.
    return comparar(cantidadDe(estado, condicion.objeto), condicion.op, condicion.valor);
  }

  if (instanceOfCondicionEn(condicion)) {
    return typeof condicion.en === 'string' && estado.ubicacion === condicion.en;
  }

  if (instanceOfCondicionLogro(condicion)) {
    return !!estado.logros?.includes(condicion.logro);
  }

  if (instanceOfCondicionFinal(condicion)) {
    return !!estado.finales?.includes(condicion.final);
  }

  return false;
}
