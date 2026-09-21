import { ICondicion, IEstadoJuego } from '@models/motor.interfaces';
import { evaluarCondicion } from './condiciones';

describe('evaluarCondicion', () => {
  const estado: IEstadoJuego = {
    vars: { salud: 60, afecto: 10, tiene_pareja: true, tiempo: 'tarde' },
  };

  it('sin condición se cumple', () => {
    expect(evaluarCondicion(null, estado)).toBeTrue();
    expect(evaluarCondicion(undefined, estado)).toBeTrue();
  });

  it('compara números con todos los operadores', () => {
    const cumple = (op: string, valor: number) =>
      evaluarCondicion({ var: 'salud', op, valor } as ICondicion, estado);

    expect(cumple('==', 60)).toBeTrue();
    expect(cumple('!=', 60)).toBeFalse();
    expect(cumple('>', 59)).toBeTrue();
    expect(cumple('>', 60)).toBeFalse();
    expect(cumple('>=', 60)).toBeTrue();
    expect(cumple('<', 61)).toBeTrue();
    expect(cumple('<=', 59)).toBeFalse();
  });

  it('compara booleanos y textos por igualdad', () => {
    expect(evaluarCondicion({ var: 'tiene_pareja', op: '==', valor: true }, estado)).toBeTrue();
    expect(evaluarCondicion({ var: 'tiene_pareja', op: '!=', valor: true }, estado)).toBeFalse();
    expect(evaluarCondicion({ var: 'tiempo', op: '==', valor: 'tarde' }, estado)).toBeTrue();
    expect(evaluarCondicion({ var: 'tiempo', op: '!=', valor: 'noche' }, estado)).toBeTrue();
  });

  it('un operador de orden sobre texto o booleano no se cumple', () => {
    expect(evaluarCondicion({ var: 'tiempo', op: '>', valor: 'a' }, estado)).toBeFalse();
    expect(evaluarCondicion({ var: 'tiene_pareja', op: '>=', valor: true }, estado)).toBeFalse();
  });

  it('un tipo distinto o una variable inexistente no se cumple, ni siquiera con !=', () => {
    expect(evaluarCondicion({ var: 'salud', op: '==', valor: '60' }, estado)).toBeFalse();
    expect(evaluarCondicion({ var: 'salud', op: '!=', valor: 'x' }, estado)).toBeFalse();
    expect(evaluarCondicion({ var: 'fantasma', op: '!=', valor: 1 }, estado)).toBeFalse();
  });

  it('y exige todas, o basta una, no invierte', () => {
    const alta: ICondicion = { var: 'salud', op: '>', valor: 50 };
    const baja: ICondicion = { var: 'salud', op: '<', valor: 50 };

    expect(evaluarCondicion({ y: [alta, alta] }, estado)).toBeTrue();
    expect(evaluarCondicion({ y: [alta, baja] }, estado)).toBeFalse();
    expect(evaluarCondicion({ o: [baja, alta] }, estado)).toBeTrue();
    expect(evaluarCondicion({ o: [baja, baja] }, estado)).toBeFalse();
    expect(evaluarCondicion({ no: baja }, estado)).toBeTrue();
    expect(evaluarCondicion({ no: alta }, estado)).toBeFalse();
  });

  it('combina condiciones anidadas', () => {
    const cond: ICondicion = {
      y: [
        { var: 'salud', op: '>=', valor: 50 },
        { o: [{ var: 'tiempo', op: '==', valor: 'noche' }, { var: 'afecto', op: '>', valor: 5 }] },
        { no: { var: 'tiene_pareja', op: '==', valor: false } },
      ],
    };
    expect(evaluarCondicion(cond, estado)).toBeTrue();
  });

  it('las condiciones mal formadas no se cumplen y no lanzan', () => {
    expect(evaluarCondicion({} as ICondicion, estado)).toBeFalse();
    expect(evaluarCondicion({ y: [] }, estado)).toBeFalse();
    expect(evaluarCondicion({ y: 'x' } as unknown as ICondicion, estado)).toBeFalse();
    expect(evaluarCondicion({ eval: 'alert(1)' } as unknown as ICondicion, estado)).toBeFalse();
  });

  describe('objetos y ubicación', () => {
    const conMochila: IEstadoJuego = { vars: {}, inventario: { llave: 1, moneda: 12 }, ubicacion: 'patio' };

    it('compara la cantidad que se tiene de un objeto', () => {
      expect(evaluarCondicion({ objeto: 'llave', op: '>=', valor: 1 }, conMochila)).toBeTrue();
      expect(evaluarCondicion({ objeto: 'moneda', op: '>', valor: 12 }, conMochila)).toBeFalse();
      expect(evaluarCondicion({ objeto: 'moneda', op: '==', valor: 12 }, conMochila)).toBeTrue();
      expect(evaluarCondicion({ objeto: 'moneda', op: '<', valor: 20 }, conMochila)).toBeTrue();
    });

    it('no tener un objeto es tener 0', () => {
      expect(evaluarCondicion({ objeto: 'pocion', op: '==', valor: 0 }, conMochila)).toBeTrue();
      expect(evaluarCondicion({ objeto: 'pocion', op: '>=', valor: 1 }, conMochila)).toBeFalse();
      expect(evaluarCondicion({ no: { objeto: 'pocion', op: '>=', valor: 1 } }, conMochila)).toBeTrue();
    });

    it('un estado sin inventario (partida antigua) no rompe', () => {
      expect(evaluarCondicion({ objeto: 'llave', op: '>=', valor: 1 }, { vars: {} })).toBeFalse();
    });

    it('la cantidad no se compara con un tipo que no es número', () => {
      expect(evaluarCondicion({ objeto: 'llave', op: '==', valor: '1' } as unknown as ICondicion, conMochila)).toBeFalse();
    });

    it('en: se cumple solo en esa ubicación', () => {
      expect(evaluarCondicion({ en: 'patio' }, conMochila)).toBeTrue();
      expect(evaluarCondicion({ en: 'biblioteca' }, conMochila)).toBeFalse();
      expect(evaluarCondicion({ no: { en: 'biblioteca' } }, conMochila)).toBeTrue();
      expect(evaluarCondicion({ en: 'patio' }, { vars: {} })).toBeFalse();
    });

    it('se combinan con variables', () => {
      const c: ICondicion = { y: [{ en: 'patio' }, { objeto: 'llave', op: '>=', valor: 1 }, { var: 'salud', op: '>', valor: 0 }] };
      expect(evaluarCondicion(c, { ...conMochila, vars: { salud: 5 } })).toBeTrue();
      expect(evaluarCondicion(c, { ...conMochila, vars: { salud: 0 } })).toBeFalse();
    });
  });

  describe('logros y finales', () => {
    const estado: IEstadoJuego = { vars: {}, logros: ['valiente'], finales: ['bueno'] };

    it('logro se cumple si ya se desbloqueó', () => {
      expect(evaluarCondicion({ logro: 'valiente' }, estado)).toBeTrue();
      expect(evaluarCondicion({ logro: 'curioso' }, estado)).toBeFalse();
    });

    it('final se cumple si ya se vio', () => {
      expect(evaluarCondicion({ final: 'bueno' }, estado)).toBeTrue();
      expect(evaluarCondicion({ final: 'malo' }, estado)).toBeFalse();
      expect(evaluarCondicion({ y: [{ final: 'bueno' }, { no: { final: 'malo' } }] }, estado)).toBeTrue();
    });

    it('un estado antiguo sin listas no rompe', () => {
      expect(evaluarCondicion({ logro: 'valiente' }, { vars: {} })).toBeFalse();
      expect(evaluarCondicion({ final: 'bueno' }, { vars: {} })).toBeFalse();
    });
  });
});
