import {
  esEfectoIr,
  esEfectoLogro,
  esEfectoObjeto,
  ICondicion,
  IEfecto,
  instanceOfComparacion,
  instanceOfCondicionEn,
  instanceOfCondicionFinal,
  instanceOfCondicionLogro,
  instanceOfCondicionNo,
  instanceOfCondicionO,
  instanceOfCondicionObjeto,
  instanceOfCondicionY,
  VariableValor,
} from '@models/motor.interfaces';

function valorTexto(valor: VariableValor | undefined): string {
  if (typeof valor === 'string') return `"${valor}"`;
  if (typeof valor === 'boolean') return valor ? 'verdadero' : 'falso';
  return valor === undefined ? '' : String(valor);
}

/** Una regla que no necesita paréntesis dentro de un `no` o de un grupo. */
function esAtomica(c: ICondicion): boolean {
  return (
    instanceOfComparacion(c) ||
    instanceOfCondicionObjeto(c) ||
    instanceOfCondicionEn(c) ||
    instanceOfCondicionLogro(c) ||
    instanceOfCondicionFinal(c)
  );
}

/**
 * Escribe una condición en la sintaxis de texto del editor: `salud >= 50 y no en patio`, `tengo llave`, `tiene_pareja`.
 * Es la forma canónica: lo que sale de aquí vuelve a leerse igual con `parsearCondicion` (ver sintaxis.ts).
 */
export function describirCondicion(condicion: ICondicion | null | undefined): string {
  if (condicion == null) {
    return 'siempre';
  }

  if (instanceOfComparacion(condicion)) {
    // Una variable de sí/no sola es la forma corta de `== verdadero`.
    return condicion.op === '==' && condicion.valor === true
      ? condicion.var
      : `${condicion.var} ${condicion.op} ${valorTexto(condicion.valor)}`;
  }

  if (instanceOfCondicionObjeto(condicion)) {
    return condicion.op === '>=' && condicion.valor === 1
      ? `tengo ${condicion.objeto}`
      : `objeto ${condicion.objeto} ${condicion.op} ${condicion.valor}`;
  }

  if (instanceOfCondicionEn(condicion)) {
    return `en ${condicion.en}`;
  }

  if (instanceOfCondicionLogro(condicion)) {
    return `logro ${condicion.logro}`;
  }

  if (instanceOfCondicionFinal(condicion)) {
    return `final ${condicion.final}`;
  }

  if (instanceOfCondicionNo(condicion)) {
    const interior = describirCondicion(condicion.no);
    return esAtomica(condicion.no) ? `no ${interior}` : `no (${interior})`;
  }

  const [items, union] = instanceOfCondicionY(condicion)
    ? [condicion.y, ' y ']
    : instanceOfCondicionO(condicion)
      ? [condicion.o, ' o ']
      : [undefined, ''];

  if (!Array.isArray(items)) {
    return '(condición inválida)';
  }

  return items
    .map(item => (esAtomica(item) || instanceOfCondicionNo(item) ? describirCondicion(item) : `(${describirCondicion(item)})`))
    .join(union);
}

export function describirEfecto(efecto: IEfecto): string {
  if (esEfectoIr(efecto)) {
    return `ir ${efecto.ir}`;
  }

  if (esEfectoLogro(efecto)) {
    return `logro ${efecto.logro}`;
  }

  if (esEfectoObjeto(efecto)) {
    const cantidad = efecto.cantidad && efecto.cantidad !== 1 ? `${efecto.cantidad} ` : '';
    return `${efecto.op} ${cantidad}${efecto.objeto}`;
  }

  switch (efecto.op) {
    case 'fijar':
      return `${efecto.var} = ${valorTexto(efecto.valor)}`;
    case 'sumar':
      return `${efecto.var} += ${valorTexto(efecto.valor)}`;
    case 'restar':
      return `${efecto.var} -= ${valorTexto(efecto.valor)}`;
    case 'multiplicar':
      return `${efecto.var} *= ${valorTexto(efecto.valor)}`;
    case 'alternar':
      return `alternar ${efecto.var}`;
    case 'avanzar':
      return `avanzar ${efecto.var}`;
    default:
      return '';
  }
}

/** Los efectos en una línea, para etiquetas y tooltips: `salud -= 10; dar llave`. */
export function describirEfectos(efectos: IEfecto[] | null | undefined): string {
  return (efectos ?? []).map(describirEfecto).join('; ');
}

/** Los efectos uno por línea, para editarlos como texto. */
export function escribirEfectos(efectos: IEfecto[] | null | undefined): string {
  return (efectos ?? []).map(describirEfecto).join('\n');
}
