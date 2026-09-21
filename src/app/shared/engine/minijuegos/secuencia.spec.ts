import { IMinijuegoSecuencia } from '@models/motor.interfaces';
import { crearSecuencia, sanearSecuencia, teclaDesdeEvento, teclaSecuencia, TECLAS, tickSecuencia } from './secuencia';

describe('secuencia', () => {
  const config: IMinijuegoSecuencia = { tipo: 'secuencia', longitud: 3, tiempoMs: 4000 };
  // aleatorio() → 0 / 0.3 / 0.6 elige izquierda / arriba / derecha (4 teclas: [0,.25) [.25,.5) [.5,.75) [.75,1))
  const valores = [0, 0.3, 0.6];
  const crear = (ahora = 0, factorTiempo = 1) => {
    let i = 0;
    return crearSecuencia(config, ahora, { factorTiempo, aleatorio: () => valores[i++ % valores.length] });
  };

  it('genera la secuencia pedida con las cuatro flechas', () => {
    const e = crear();

    expect(e.secuencia).toEqual(['izquierda', 'arriba', 'derecha']);
    expect(TECLAS.length).toBe(4);
  });

  it('un aleatorio de 1 (extremo) sigue dando una flecha válida', () => {
    const e = crearSecuencia(config, 0, { factorTiempo: 1, aleatorio: () => 1 });

    for (const t of e.secuencia) expect(TECLAS).toContain(t);
  });

  it('acertarlas todas en orden gana', () => {
    let e = crear();
    e = teclaSecuencia(e, 'izquierda');
    e = teclaSecuencia(e, 'arriba');
    expect(e.terminado).toBeFalse();
    expect(e.puntaje).toBe(2);
    e = teclaSecuencia(e, 'derecha');

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeTrue();
    expect(e.puntaje).toBe(3);
  });

  it('una flecha equivocada termina el intento con lo acertado hasta ahí', () => {
    let e = crear();
    e = teclaSecuencia(e, 'izquierda');
    e = teclaSecuencia(e, 'abajo');

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeFalse();
    expect(e.puntaje).toBe(1);
  });

  it('se acaba el tiempo', () => {
    let e = crear();
    e = teclaSecuencia(e, 'izquierda');

    expect(tickSecuencia(e, 3999).terminado).toBeFalse();
    const fin = tickSecuencia(e, 4000);
    expect(fin.terminado).toBeTrue();
    expect(fin.exito).toBeFalse();
    expect(fin.puntaje).toBe(1);
  });

  it('el tiempo cuenta desde que se creó', () => {
    const e = crear(10_000);

    expect(tickSecuencia(e, 13_999).terminado).toBeFalse();
    expect(tickSecuencia(e, 14_000).terminado).toBeTrue();
  });

  it('el factor de tiempo alarga el límite', () => {
    const e = crear(0, 2.5);

    expect(e.limiteMs).toBe(10_000);
    expect(tickSecuencia(e, 9_999).terminado).toBeFalse();
  });

  it('ya terminado no cambia', () => {
    const fin = teclaSecuencia(crear(), 'abajo');

    expect(teclaSecuencia(fin, 'izquierda')).toBe(fin);
    expect(tickSecuencia(fin, 99_999)).toBe(fin);
  });

  it('traduce las teclas del navegador y descarta las demás', () => {
    expect(teclaDesdeEvento('ArrowLeft')).toBe('izquierda');
    expect(teclaDesdeEvento('ArrowUp')).toBe('arriba');
    expect(teclaDesdeEvento('ArrowRight')).toBe('derecha');
    expect(teclaDesdeEvento('ArrowDown')).toBe('abajo');
    expect(teclaDesdeEvento('a')).toBeUndefined();
    expect(teclaDesdeEvento('Enter')).toBeUndefined();
  });

  it('sanea una configuración fuera de límites', () => {
    expect(sanearSecuencia({ tipo: 'secuencia', longitud: 100, tiempoMs: 1 })).toEqual({ tipo: 'secuencia', longitud: 12, tiempoMs: 1000 });
  });
});
