import { ICondicion, IDefiniciones } from '@models/motor.interfaces';
import {
  codigoFila,
  filaDesdeCodigo,
  filaNueva,
  hayReglasPosibles,
  operadoresFila,
  operadoresPara,
  parseCondicion,
  serializarCondicion,
  valorPorDefecto,
} from './condicion-editor.model';

describe('condicion-editor.model', () => {
  const cmp: ICondicion = { var: 'salud', op: '>=', valor: 50 };
  const defs: IDefiniciones = {
    variables: [
      { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', min: 10, valores: [], hud: 'oculto' },
      { clave: 'tiempo', etiqueta: 'Tiempo', tipo: 'texto', valores: ['mañana', 'tarde'], hud: 'oculto' },
    ],
    objetos: [{ id: 'llave', nombre: 'Llave', descripcion: '', apilable: false, inicial: 0 }],
    ubicaciones: [{ id: 'patio', nombre: 'Patio' }],
    logros: [{ id: 'valiente', nombre: 'Valiente', descripcion: '' }],
    finales: [{ id: 'bueno', nombre: 'Bueno', descripcion: '' }],
  };

  it('sin condición no hay filas', () => {
    expect(parseCondicion(null)).toEqual({ modo: 'y', filas: [] });
    expect(serializarCondicion({ modo: 'y', filas: [] })).toBeNull();
  });

  it('una comparación suelta es una fila y vuelve a serializarse igual', () => {
    const modelo = parseCondicion(cmp);
    expect(modelo).toEqual({ modo: 'y', filas: [{ negar: false, tipo: 'var', ref: 'salud', op: '>=', valor: 50 }] });
    expect(serializarCondicion(modelo as never)).toEqual(cmp);
  });

  it('una negación de comparación es una fila con "no"', () => {
    const c: ICondicion = { no: cmp };
    const modelo = parseCondicion(c);
    expect((modelo as { filas: { negar: boolean }[] }).filas[0].negar).toBeTrue();
    expect(serializarCondicion(modelo as never)).toEqual(c);
  });

  it('un grupo y/o hace round-trip', () => {
    const y: ICondicion = { y: [cmp, { no: { var: 'tiene_pareja', op: '==', valor: true } }] };
    const o: ICondicion = { o: [cmp, { var: 'tiempo', op: '==', valor: 'noche' }] };

    expect(serializarCondicion(parseCondicion(y) as never)).toEqual(y);
    expect(serializarCondicion(parseCondicion(o) as never)).toEqual(o);
  });

  it('las reglas de objeto y de ubicación hacen round-trip, sueltas, negadas y en grupo', () => {
    const objeto: ICondicion = { objeto: 'llave', op: '>=', valor: 1 };
    const en: ICondicion = { en: 'patio' };
    const grupo: ICondicion = { y: [objeto, { no: en }, cmp] };

    expect(serializarCondicion(parseCondicion(objeto) as never)).toEqual(objeto);
    expect(serializarCondicion(parseCondicion(en) as never)).toEqual(en);
    expect(serializarCondicion(parseCondicion({ no: en }) as never)).toEqual({ no: en });
    expect(serializarCondicion(parseCondicion(grupo) as never)).toEqual(grupo);
    expect(parseCondicion(objeto)).toEqual({ modo: 'y', filas: [{ negar: false, tipo: 'objeto', ref: 'llave', op: '>=', valor: 1 }] });
  });

  it('las reglas de logro y de final hacen round-trip, sueltas, negadas y en grupo', () => {
    const logro: ICondicion = { logro: 'valiente' };
    const final: ICondicion = { final: 'bueno' };

    expect(serializarCondicion(parseCondicion(logro) as never)).toEqual(logro);
    expect(serializarCondicion(parseCondicion({ no: final }) as never)).toEqual({ no: final });
    expect(serializarCondicion(parseCondicion({ y: [logro, final, cmp] }) as never)).toEqual({ y: [logro, final, cmp] });
    expect(parseCondicion(logro)).toEqual({ modo: 'y', filas: [{ negar: false, tipo: 'logro', ref: 'valiente', op: '==', valor: true }] });
  });

  it('las reglas de logro y de final solo admiten "es"', () => {
    const fila = (tipo: 'logro' | 'final') => ({ negar: false, tipo, ref: 'x', op: '==' as const, valor: true });

    expect(operadoresFila(fila('logro'), defs)).toEqual(['==']);
    expect(operadoresFila(fila('final'), defs)).toEqual(['==']);
  });

  it('un grupo con una sola regla se aplana', () => {
    expect(serializarCondicion(parseCondicion({ y: [cmp] }) as never)).toEqual(cmp);
  });

  it('las condiciones anidadas son "avanzada" y no se pierden', () => {
    expect(parseCondicion({ y: [cmp, { o: [cmp, cmp] }] })).toBe('avanzada');
    expect(parseCondicion({ no: { no: cmp } })).toBe('avanzada');
    expect(parseCondicion({ no: { y: [cmp, cmp] } })).toBe('avanzada');
    expect(parseCondicion({ y: 'x' } as unknown as ICondicion)).toBe('avanzada');
  });

  it('los operadores de orden solo existen para números y para objetos', () => {
    expect(operadoresPara('numero')).toContain('>=');
    expect(operadoresPara('texto')).toEqual(['==', '!=']);
    expect(operadoresPara('booleano')).toEqual(['==', '!=']);
    expect(operadoresPara(undefined)).toEqual(['==', '!=']);

    const fila = (tipo: 'var' | 'objeto' | 'en', ref: string) => ({ negar: false, tipo, ref, op: '==' as const, valor: 1 });
    expect(operadoresFila(fila('objeto', 'llave'), defs)).toContain('>=');
    expect(operadoresFila(fila('en', 'patio'), defs)).toEqual(['==']);
    expect(operadoresFila(fila('var', 'salud'), defs)).toContain('>=');
    expect(operadoresFila(fila('var', 'tiempo'), defs)).toEqual(['==', '!=']);
  });

  it('valores por defecto según el tipo de la variable', () => {
    expect(valorPorDefecto({ clave: 'a', etiqueta: 'a', tipo: 'numero', min: 5, valores: [], hud: 'oculto' })).toBe(5);
    expect(valorPorDefecto({ clave: 'a', etiqueta: 'a', tipo: 'booleano', valores: [], hud: 'oculto' })).toBeTrue();
    expect(valorPorDefecto({ clave: 'a', etiqueta: 'a', tipo: 'texto', valores: ['x', 'y'], hud: 'oculto' })).toBe('x');
    expect(valorPorDefecto(undefined)).toBe('');
  });

  it('una regla nueva por código usa lo elegido y un valor válido', () => {
    expect(filaDesdeCodigo('var:tiempo', defs)).toEqual({ negar: false, tipo: 'var', ref: 'tiempo', op: '==', valor: 'mañana' });
    expect(filaDesdeCodigo('var:salud', defs).valor).toBe(10);
    expect(filaDesdeCodigo('objeto:llave', defs)).toEqual({ negar: false, tipo: 'objeto', ref: 'llave', op: '>=', valor: 1 });
    expect(filaDesdeCodigo('en:patio', defs)).toEqual(jasmine.objectContaining({ tipo: 'en', ref: 'patio' }));
  });

  it('el código de una fila es el que reconoce filaDesdeCodigo', () => {
    for (const codigo of ['var:salud', 'objeto:llave', 'en:patio', 'logro:valiente', 'final:bueno']) {
      expect(codigoFila(filaDesdeCodigo(codigo, defs))).toBe(codigo);
    }
  });

  it('la primera regla posible es una variable, si no un objeto, si no una ubicación', () => {
    expect(filaNueva(defs)?.tipo).toBe('var');
    expect(filaNueva({ variables: [], objetos: defs.objetos })?.tipo).toBe('objeto');
    expect(filaNueva({ variables: [], ubicaciones: defs.ubicaciones })?.tipo).toBe('en');
    expect(filaNueva({ variables: [], logros: defs.logros })?.tipo).toBe('logro');
    expect(filaNueva({ variables: [], finales: defs.finales })?.tipo).toBe('final');
    expect(filaNueva({ variables: [] })).toBeUndefined();
  });

  it('hay reglas posibles con cualquiera de las tres cosas definidas', () => {
    expect(hayReglasPosibles({ variables: [] })).toBeFalse();
    expect(hayReglasPosibles({ variables: [], objetos: defs.objetos })).toBeTrue();
    expect(hayReglasPosibles({ variables: [], ubicaciones: defs.ubicaciones })).toBeTrue();
    expect(hayReglasPosibles({ variables: [], logros: defs.logros })).toBeTrue();
    expect(hayReglasPosibles({ variables: [], finales: defs.finales })).toBeTrue();
  });
});
