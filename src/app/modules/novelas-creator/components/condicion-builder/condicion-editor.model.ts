import {
  ICondicion,
  IDefiniciones,
  instanceOfComparacion,
  instanceOfCondicionEn,
  instanceOfCondicionFinal,
  instanceOfCondicionLogro,
  instanceOfCondicionNo,
  instanceOfCondicionO,
  instanceOfCondicionObjeto,
  instanceOfCondicionY,
  IVariableDef,
  OpComparacion,
  VariableTipo,
  VariableValor,
} from '@models/motor.interfaces';

/** De qué trata una regla: el valor de una variable, la cantidad de un objeto, la ubicación actual, un logro o un final. */
export type TipoFila = 'var' | 'objeto' | 'en' | 'logro' | 'final';

/** Una regla editable: `[no] qué operador valor`. `ref` es la clave de la variable, el id del objeto o el de la ubicación. */
export interface IFilaCondicion {
  negar: boolean;
  tipo: TipoFila;
  ref: string;
  op: OpComparacion;
  valor: VariableValor;
}

/** Lo que el constructor visual sabe editar: una lista de reglas unidas por "todas" (y) o "alguna" (o). */
export interface IModeloCondicion {
  modo: 'y' | 'o';
  filas: IFilaCondicion[];
}

export const OPERADORES_NUMERO: OpComparacion[] = ['==', '!=', '>', '>=', '<', '<='];
export const OPERADORES_IGUALDAD: OpComparacion[] = ['==', '!='];

export function operadoresPara(tipo: VariableTipo | undefined): OpComparacion[] {
  return tipo === 'numero' ? OPERADORES_NUMERO : OPERADORES_IGUALDAD;
}

/** Operadores que admite una regla: los de orden solo para números y para la cantidad de un objeto. */
export function operadoresFila(fila: IFilaCondicion, defs: IDefiniciones): OpComparacion[] {
  if (fila.tipo === 'objeto') return OPERADORES_NUMERO;
  if (fila.tipo === 'en' || fila.tipo === 'logro' || fila.tipo === 'final') return ['=='];
  return operadoresPara(defs.variables.find(v => v.clave === fila.ref)?.tipo);
}

export function valorPorDefecto(def: IVariableDef | undefined): VariableValor {
  switch (def?.tipo) {
    case 'numero':
      return def.min ?? 0;
    case 'booleano':
      return true;
    default:
      return def?.valores?.[0] ?? '';
  }
}

/** Código de la opción del select "¿de qué trata?": `var:salud`, `objeto:llave`, `en:patio`. */
export function codigoFila(fila: Pick<IFilaCondicion, 'tipo' | 'ref'>): string {
  return `${fila.tipo}:${fila.ref}`;
}

/** Una regla nueva para lo que indica el código, con operador y valor válidos. */
export function filaDesdeCodigo(codigo: string, defs: IDefiniciones): IFilaCondicion {
  const separador = codigo.indexOf(':');
  const tipo = codigo.slice(0, separador) as TipoFila;
  const ref = codigo.slice(separador + 1);

  switch (tipo) {
    case 'objeto':
      return { negar: false, tipo, ref, op: '>=', valor: 1 };
    case 'en':
    case 'logro':
    case 'final':
      return { negar: false, tipo, ref, op: '==', valor: true };
    default:
      return {
        negar: false,
        tipo: 'var',
        ref,
        op: '==',
        valor: valorPorDefecto(defs.variables.find(v => v.clave === ref)),
      };
  }
}

/** La primera regla posible con lo definido: una variable, si no un objeto, si no una ubicación. */
export function filaNueva(defs: IDefiniciones): IFilaCondicion | undefined {
  const variable = defs.variables[0];
  if (variable) return filaDesdeCodigo(`var:${variable.clave}`, defs);
  const objeto = defs.objetos?.[0];
  if (objeto) return filaDesdeCodigo(`objeto:${objeto.id}`, defs);
  const ubicacion = defs.ubicaciones?.[0];
  if (ubicacion) return filaDesdeCodigo(`en:${ubicacion.id}`, defs);
  const logro = defs.logros?.[0];
  if (logro) return filaDesdeCodigo(`logro:${logro.id}`, defs);
  const final = defs.finales?.[0];
  if (final) return filaDesdeCodigo(`final:${final.id}`, defs);
  return undefined;
}

/** ¿Hay algo que citar en una condición? Una variable, un objeto, una ubicación, un logro o un final. */
export function hayReglasPosibles(defs: IDefiniciones): boolean {
  return (
    defs.variables.length > 0 ||
    (defs.objetos?.length ?? 0) > 0 ||
    (defs.ubicaciones?.length ?? 0) > 0 ||
    (defs.logros?.length ?? 0) > 0 ||
    (defs.finales?.length ?? 0) > 0
  );
}

function parseComparacion(c: ICondicion, negar: boolean): IFilaCondicion | undefined {
  if (instanceOfComparacion(c)) {
    return { negar, tipo: 'var', ref: c.var, op: c.op, valor: c.valor };
  }
  if (instanceOfCondicionObjeto(c)) {
    return { negar, tipo: 'objeto', ref: c.objeto, op: c.op, valor: c.valor };
  }
  if (instanceOfCondicionEn(c)) {
    return { negar, tipo: 'en', ref: c.en, op: '==', valor: true };
  }
  if (instanceOfCondicionLogro(c)) {
    return { negar, tipo: 'logro', ref: c.logro, op: '==', valor: true };
  }
  if (instanceOfCondicionFinal(c)) {
    return { negar, tipo: 'final', ref: c.final, op: '==', valor: true };
  }
  return undefined;
}

function parseFila(c: ICondicion): IFilaCondicion | undefined {
  if (instanceOfCondicionNo(c)) {
    return parseComparacion(c.no, true);
  }
  return parseComparacion(c, false);
}

function serializarFila(f: IFilaCondicion): ICondicion {
  const regla: ICondicion =
    f.tipo === 'objeto'
      ? { objeto: f.ref, op: f.op, valor: Number(f.valor) }
      : f.tipo === 'en'
        ? { en: f.ref }
        : f.tipo === 'logro'
          ? { logro: f.ref }
          : f.tipo === 'final'
            ? { final: f.ref }
            : { var: f.ref, op: f.op, valor: f.valor };
  return f.negar ? { no: regla } : regla;
}

/**
 * Convierte el AST en el modelo del constructor. Si la condición es más compleja de lo que el
 * constructor sabe representar (grupos anidados), devuelve 'avanzada' para no destruirla al editar.
 */
export function parseCondicion(
  condicion: ICondicion | null | undefined
): IModeloCondicion | 'avanzada' {
  if (condicion == null) {
    return { modo: 'y', filas: [] };
  }

  const grupo = instanceOfCondicionY(condicion)
    ? { modo: 'y' as const, items: condicion.y }
    : instanceOfCondicionO(condicion)
      ? { modo: 'o' as const, items: condicion.o }
      : { modo: 'y' as const, items: [condicion] };

  if (!Array.isArray(grupo.items)) {
    return 'avanzada';
  }

  const filas: IFilaCondicion[] = [];
  for (const item of grupo.items) {
    const fila = parseFila(item);
    if (!fila) {
      return 'avanzada';
    }
    filas.push(fila);
  }

  return { modo: grupo.modo, filas };
}

export function serializarCondicion(modelo: IModeloCondicion): ICondicion | null {
  if (modelo.filas.length === 0) {
    return null;
  }
  if (modelo.filas.length === 1) {
    return serializarFila(modelo.filas[0]);
  }
  const items = modelo.filas.map(serializarFila);
  return modelo.modo === 'y' ? { y: items } : { o: items };
}
