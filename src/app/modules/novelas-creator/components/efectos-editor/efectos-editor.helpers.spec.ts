import { IDefiniciones } from '@models/motor.interfaces';
import { codigoEfecto, efectoDesdeCodigo, efectoNuevo, hayEfectosPosibles, operacionesPara } from './efectos-editor.component';

describe('efectos-editor (funciones)', () => {
  const defs: IDefiniciones = {
    variables: [
      { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', valores: [], hud: 'oculto' },
      { clave: 'pareja', etiqueta: 'Pareja', tipo: 'booleano', valores: [], hud: 'oculto' },
      { clave: 'tiempo', etiqueta: 'Tiempo', tipo: 'texto', valores: ['mañana', 'tarde'], hud: 'oculto' },
    ],
    objetos: [{ id: 'llave', nombre: 'Llave', descripcion: '', apilable: false, inicial: 0 }],
    ubicaciones: [{ id: 'patio', nombre: 'Patio' }],
    logros: [{ id: 'valiente', nombre: 'Valiente', descripcion: '' }],
  };

  it('las operaciones dependen del tipo de la variable', () => {
    expect(operacionesPara('numero')).toEqual(['fijar', 'sumar', 'restar', 'multiplicar']);
    expect(operacionesPara('booleano')).toEqual(['fijar', 'alternar']);
    expect(operacionesPara('texto')).toEqual(['fijar']);
    expect(operacionesPara(undefined)).toEqual(['fijar']);
  });

  it('avanzar solo se ofrece para textos con lista de valores (un reloj)', () => {
    expect(operacionesPara('texto', true)).toEqual(['fijar', 'avanzar']);
    expect(operacionesPara('numero', true)).not.toContain('avanzar');
    expect(operacionesPara('booleano', true)).not.toContain('avanzar');
  });

  it('un efecto nuevo por código es válido para lo que se eligió', () => {
    expect(efectoDesdeCodigo('var:salud', defs)).toEqual({ var: 'salud', op: 'sumar', valor: 1 });
    expect(efectoDesdeCodigo('var:pareja', defs)).toEqual({ var: 'pareja', op: 'fijar', valor: true });
    expect(efectoDesdeCodigo('var:tiempo', defs)).toEqual({ var: 'tiempo', op: 'fijar', valor: 'mañana' });
    expect(efectoDesdeCodigo('objeto:llave', defs)).toEqual({ objeto: 'llave', op: 'dar', cantidad: 1 });
    expect(efectoDesdeCodigo('ir:patio', defs)).toEqual({ ir: 'patio' });
    expect(efectoDesdeCodigo('logro:valiente', defs)).toEqual({ logro: 'valiente' });
  });

  it('el código de un efecto es el que reconoce efectoDesdeCodigo', () => {
    for (const codigo of ['var:salud', 'objeto:llave', 'ir:patio', 'logro:valiente']) {
      expect(codigoEfecto(efectoDesdeCodigo(codigo, defs))).toBe(codigo);
    }
  });

  it('el primer efecto posible es una variable, si no un objeto, si no ir a una ubicación', () => {
    expect(efectoNuevo(defs)).toEqual(jasmine.objectContaining({ var: 'salud' }));
    expect(efectoNuevo({ variables: [], objetos: defs.objetos })).toEqual(jasmine.objectContaining({ objeto: 'llave' }));
    expect(efectoNuevo({ variables: [], ubicaciones: defs.ubicaciones })).toEqual({ ir: 'patio' });
    expect(efectoNuevo({ variables: [], logros: defs.logros })).toEqual({ logro: 'valiente' });
    expect(efectoNuevo({ variables: [] })).toBeUndefined();
  });

  it('hay efectos posibles con cualquiera de las cuatro cosas definidas; los finales no se pueden "hacer"', () => {
    expect(hayEfectosPosibles({ variables: [] })).toBeFalse();
    expect(hayEfectosPosibles({ variables: [], logros: defs.logros })).toBeTrue();
    expect(hayEfectosPosibles({ variables: [], finales: [{ id: 'bueno', nombre: 'B', descripcion: '' }] })).toBeFalse();
  });
});
