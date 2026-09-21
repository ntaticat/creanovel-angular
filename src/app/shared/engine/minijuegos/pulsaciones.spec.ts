import { IMinijuegoPulsaciones } from '@models/motor.interfaces';
import { crearPulsaciones, pulsar, sanearPulsaciones, tickPulsaciones } from './pulsaciones';

describe('pulsaciones', () => {
  const config: IMinijuegoPulsaciones = { tipo: 'pulsaciones', objetivo: 5, tiempoMs: 2000 };
  const crear = (ahora = 0, factorTiempo = 1) => crearPulsaciones(config, ahora, { factorTiempo, aleatorio: Math.random });

  it('gana al llegar al objetivo antes de que se acabe el tiempo', () => {
    let e = crear();
    for (let i = 0; i < 4; i++) e = pulsar(e);
    expect(e.terminado).toBeFalse();
    expect(e.cuenta).toBe(4);
    e = pulsar(e);

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeTrue();
    expect(e.puntaje).toBe(5);
  });

  it('pierde si se acaba el tiempo, con el puntaje de lo que llevaba', () => {
    let e = crear();
    e = pulsar(pulsar(e));

    expect(tickPulsaciones(e, 1999).terminado).toBeFalse();
    const fin = tickPulsaciones(e, 2000);
    expect(fin.terminado).toBeTrue();
    expect(fin.exito).toBeFalse();
    expect(fin.puntaje).toBe(2);
  });

  it('el tiempo cuenta desde que se creó y el factor lo alarga', () => {
    expect(tickPulsaciones(crear(5000), 6999).terminado).toBeFalse();
    expect(tickPulsaciones(crear(5000), 7000).terminado).toBeTrue();
    expect(crear(0, 2.5).limiteMs).toBe(5000);
  });

  it('ya terminado no cambia ni suma', () => {
    let e = crear();
    for (let i = 0; i < 5; i++) e = pulsar(e);

    expect(pulsar(e)).toBe(e);
    expect(tickPulsaciones(e, 99_999)).toBe(e);
    expect(e.cuenta).toBe(5);
  });

  it('sanea una configuración fuera de límites', () => {
    expect(sanearPulsaciones({ tipo: 'pulsaciones', objetivo: 1, tiempoMs: 999_999 })).toEqual({ tipo: 'pulsaciones', objetivo: 3, tiempoMs: 30000 });
    expect(sanearPulsaciones({ tipo: 'pulsaciones' } as IMinijuegoPulsaciones).objetivo).toBe(10);
  });
});
