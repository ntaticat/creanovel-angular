import { IMinijuegoConfig } from '@models/motor.interfaces';
import {
  crearMinijuego,
  describirMinijuego,
  eventoMinijuego,
  puntajeMaximo,
  resultadoDe,
  resultadoOmitido,
  tickMinijuego,
} from './minijuego';

describe('minijuego (despachador)', () => {
  const configs: IMinijuegoConfig[] = [
    { tipo: 'reflejo', objetivos: 3, aciertosNecesarios: 2, duracionMs: 1000 },
    { tipo: 'precision', velocidad: 5, anchoZona: 20, intentos: 2 },
    { tipo: 'secuencia', longitud: 3, tiempoMs: 4000 },
    { tipo: 'pulsaciones', objetivo: 4, tiempoMs: 3000 },
  ];
  const opciones = { factorTiempo: 1, aleatorio: () => 0.5 };

  it('crea el estado del tipo pedido, sin terminar', () => {
    for (const config of configs) {
      const estado = crearMinijuego(config, 0, opciones);

      expect(estado.tipo).toBe(config.tipo);
      expect(estado.terminado).toBeFalse();
      expect(resultadoDe(estado)).toBeUndefined();
    }
  });

  it('un evento de otro minijuego no hace nada', () => {
    const pulsaciones = crearMinijuego(configs[3], 0, opciones);
    const reflejo = crearMinijuego(configs[0], 0, opciones);

    expect(eventoMinijuego(pulsaciones, { tipo: 'parar' }, 0, opciones)).toBe(pulsaciones);
    expect(eventoMinijuego(pulsaciones, { tipo: 'acierto' }, 0, opciones)).toBe(pulsaciones);
    expect(eventoMinijuego(reflejo, { tipo: 'pulsar' }, 0, opciones)).toBe(reflejo);
    expect(eventoMinijuego(reflejo, { tipo: 'tecla', tecla: 'arriba' }, 0, opciones)).toBe(reflejo);
  });

  it('juega un minijuego completo a través del despachador', () => {
    let e = crearMinijuego(configs[3], 0, opciones);
    for (let i = 0; i < 4; i++) e = eventoMinijuego(e, { tipo: 'pulsar' }, i * 100, opciones);

    expect(resultadoDe(e)).toEqual({ exito: true, puntaje: 4 });
  });

  it('el tiempo se pasa por tick a cualquier tipo', () => {
    const e = tickMinijuego(crearMinijuego(configs[3], 0, opciones), 5000);

    expect(resultadoDe(e)).toEqual({ exito: false, puntaje: 0 });
  });

  it('omitir es éxito con el puntaje máximo de cada tipo', () => {
    expect(resultadoOmitido(configs[0])).toEqual({ exito: true, puntaje: 3 });
    expect(resultadoOmitido(configs[1])).toEqual({ exito: true, puntaje: 1 });
    expect(resultadoOmitido(configs[2])).toEqual({ exito: true, puntaje: 3 });
    expect(resultadoOmitido(configs[3])).toEqual({ exito: true, puntaje: 4 });
    expect(configs.map(puntajeMaximo)).toEqual([3, 1, 3, 4]);
  });

  it('omitir usa la configuración saneada', () => {
    expect(resultadoOmitido({ tipo: 'reflejo', objetivos: 999, aciertosNecesarios: 1, duracionMs: 1000 }).puntaje).toBe(20);
  });

  it('describe cada minijuego', () => {
    expect(configs.map(describirMinijuego)).toEqual([
      'Reflejo: 2 de 3 objetivos',
      'Precisión: 2 intentos',
      'Secuencia: 3 flechas',
      'Pulsaciones: 4',
    ]);
    expect(describirMinijuego({ tipo: 'precision', velocidad: 5, anchoZona: 20, intentos: 1 })).toBe('Precisión: 1 intento');
    expect(describirMinijuego(null)).toBe('(sin minijuego)');
  });

  it('un factor de tiempo absurdo se acota (nunca más de x5, nunca menos de x1)', () => {
    const enorme = crearMinijuego(configs[3], 0, { factorTiempo: 1000, aleatorio: () => 0.5 });
    const negativo = crearMinijuego(configs[3], 0, { factorTiempo: -3, aleatorio: () => 0.5 });
    const nan = crearMinijuego(configs[3], 0, { factorTiempo: NaN, aleatorio: () => 0.5 });

    expect(enorme.tipo === 'pulsaciones' && enorme.limiteMs).toBe(15000);
    expect(negativo.tipo === 'pulsaciones' && negativo.limiteMs).toBe(3000);
    expect(nan.tipo === 'pulsaciones' && nan.limiteMs).toBe(3000);
  });
});
