import { ICondicion } from '@models/motor.interfaces';
import { describirCondicion, describirEfecto, describirEfectos, escribirEfectos } from './texto';

describe('texto del motor', () => {
  it('describe una comparación con cada tipo de valor', () => {
    expect(describirCondicion({ var: 'salud', op: '>=', valor: 50 })).toBe('salud >= 50');
    expect(describirCondicion({ var: 'tiempo', op: '==', valor: 'tarde' })).toBe('tiempo == "tarde"');
    expect(describirCondicion({ var: 'pareja', op: '==', valor: true })).toBe('pareja');            // forma corta de una variable de sí/no
    expect(describirCondicion({ var: 'pareja', op: '==', valor: false })).toBe('pareja == falso');
  });

  it('sin condición es "siempre"', () => {
    expect(describirCondicion(null)).toBe('siempre');
  });

  it('une con y/o y agrupa lo anidado', () => {
    const c: ICondicion = {
      y: [
        { var: 'salud', op: '>', valor: 1 },
        { o: [{ var: 'a', op: '==', valor: 1 }, { no: { var: 'b', op: '==', valor: false } }] },
      ],
    };
    expect(describirCondicion(c)).toBe('salud > 1 y (a == 1 o no b == falso)');
  });

  it('una negación de un grupo lleva paréntesis', () => {
    expect(describirCondicion({ no: { y: [{ var: 'a', op: '>', valor: 1 }, { var: 'b', op: '<', valor: 2 }] } })).toBe(
      'no (a > 1 y b < 2)'
    );
  });

  it('una condición inválida no rompe', () => {
    expect(describirCondicion({ y: 'x' } as unknown as ICondicion)).toBe('(condición inválida)');
  });

  it('describe cada efecto', () => {
    expect(describirEfecto({ var: 'salud', op: 'restar', valor: 30 })).toBe('salud -= 30');
    expect(describirEfecto({ var: 'salud', op: 'sumar', valor: 5 })).toBe('salud += 5');
    expect(describirEfecto({ var: 'salud', op: 'multiplicar', valor: 2 })).toBe('salud *= 2');
    expect(describirEfecto({ var: 't', op: 'fijar', valor: 'noche' })).toBe('t = "noche"');
    expect(describirEfecto({ var: 'p', op: 'alternar' })).toBe('alternar p');
    expect(describirEfectos([{ var: 'a', op: 'sumar', valor: 1 }, { var: 'p', op: 'alternar' }])).toBe('a += 1; alternar p');
    expect(describirEfectos(null)).toBe('');
  });

  it('describe objetos y ubicaciones', () => {
    expect(describirCondicion({ objeto: 'llave', op: '>=', valor: 1 })).toBe('tengo llave');
    expect(describirCondicion({ objeto: 'moneda', op: '>=', valor: 3 })).toBe('objeto moneda >= 3');
    expect(describirCondicion({ objeto: 'llave', op: '==', valor: 0 })).toBe('objeto llave == 0');
    expect(describirCondicion({ en: 'patio' })).toBe('en patio');
    expect(describirCondicion({ no: { en: 'patio' } })).toBe('no en patio');
    expect(describirCondicion({ y: [{ en: 'patio' }, { no: { objeto: 'llave', op: '>=', valor: 1 } }] })).toBe(
      'en patio y no tengo llave'
    );
    expect(describirEfecto({ objeto: 'llave', op: 'dar' })).toBe('dar llave');
    expect(describirEfecto({ objeto: 'moneda', op: 'quitar', cantidad: 5 })).toBe('quitar 5 moneda');
    expect(describirEfecto({ ir: 'patio' })).toBe('ir patio');
    expect(describirEfecto({ logro: 'valiente' })).toBe('logro valiente');
    expect(describirEfecto({ var: 'tiempo', op: 'avanzar' })).toBe('avanzar tiempo');
    expect(describirCondicion({ logro: 'valiente' })).toBe('logro valiente');
    expect(describirCondicion({ final: 'bueno' })).toBe('final bueno');
  });

  it('escribirEfectos pone uno por línea', () => {
    expect(escribirEfectos([{ var: 'a', op: 'sumar', valor: 1 }, { objeto: 'llave', op: 'dar' }])).toBe('a += 1\ndar llave');
    expect(escribirEfectos(null)).toBe('');
  });
});
