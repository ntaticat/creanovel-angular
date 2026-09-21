import { IMinijuegoPrecision } from '@models/motor.interfaces';
import { crearPrecision, pararPrecision, sanearPrecision, tickPrecision, velocidadPorSegundo } from './precision';

describe('precision', () => {
  const config: IMinijuegoPrecision = { tipo: 'precision', velocidad: 5, anchoZona: 20, intentos: 2 };
  // aleatorio() = 0.5 → la zona empieza en 0.5 * (100 - 20) = 40 y ocupa 40–60.
  const opciones = { factorTiempo: 1, aleatorio: () => 0.5 };
  const crear = () => crearPrecision(config, 0, opciones);
  const v = velocidadPorSegundo(5); // 95 % por segundo

  it('empieza a la izquierda con la zona sorteada', () => {
    const e = crear();

    expect(e.posicion).toBe(0);
    expect(e.direccion).toBe(1);
    expect(e.zona).toEqual({ inicio: 40, ancho: 20 });
    expect(e.velocidad).toBe(v);
  });

  it('la zona siempre cabe en la barra', () => {
    for (const azar of [0, 0.999999, 1]) {
      const e = crearPrecision(config, 0, { factorTiempo: 1, aleatorio: () => azar });
      expect(e.zona.inicio).toBeGreaterThanOrEqual(0);
      expect(e.zona.inicio + e.zona.ancho).toBeLessThanOrEqual(100);
    }
  });

  it('el marcador avanza según el tiempo transcurrido', () => {
    const e = tickPrecision(crear(), 500);

    expect(e.posicion).toBeCloseTo(v * 0.5, 5);
  });

  it('rebota en el extremo derecho y vuelve', () => {
    // 100 % / 95 %/s ≈ 1,0526 s: a los 1,2 s ya rebotó y va hacia la izquierda.
    const e = tickPrecision(crear(), 1200);

    expect(e.direccion).toBe(-1);
    expect(e.posicion).toBeCloseTo(100 - (v * 1.2 - 100), 5);
  });

  it('un tick larguísimo cruza la barra varias veces y queda dentro de 0–100', () => {
    const e = tickPrecision(crear(), 60_000);

    expect(e.posicion).toBeGreaterThanOrEqual(0);
    expect(e.posicion).toBeLessThanOrEqual(100);
  });

  it('dividir el tiempo en ticks pequeños da el mismo resultado que un tick grande', () => {
    let a = crear();
    for (let t = 100; t <= 3000; t += 100) a = tickPrecision(a, t);
    const b = tickPrecision(crear(), 3000);

    expect(a.posicion).toBeCloseTo(b.posicion, 4);
    expect(a.direccion).toBe(b.direccion);
  });

  it('parar dentro de la zona gana', () => {
    let e = tickPrecision(crear(), 500);       // posición ≈ 47,5 → dentro de 40–60
    e = pararPrecision(e, opciones);

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeTrue();
    expect(e.puntaje).toBe(1);
  });

  it('parar fuera gasta un intento y cambia la zona de sitio', () => {
    let e = crear();                           // posición 0: fuera
    e = pararPrecision(e, { factorTiempo: 1, aleatorio: () => 0 });

    expect(e.terminado).toBeFalse();
    expect(e.intento).toBe(2);
    expect(e.zona.inicio).toBe(0);
    expect(e.ultimaParada).toBe(0);
  });

  it('pierde al agotar los intentos', () => {
    let e = crear();
    e = pararPrecision(e, opciones);
    e = pararPrecision(e, opciones);

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeFalse();
    expect(e.puntaje).toBe(0);
  });

  it('los bordes de la zona cuentan como dentro', () => {
    const borde = { ...crear(), posicion: 40 };
    expect(pararPrecision(borde, opciones).exito).toBeTrue();
    expect(pararPrecision({ ...crear(), posicion: 60 }, opciones).exito).toBeTrue();
    expect(pararPrecision({ ...crear(), posicion: 60.01 }, opciones).exito).toBeFalse();
  });

  it('con más tiempo el marcador va más despacio', () => {
    const lento = crearPrecision(config, 0, { factorTiempo: 2.5, aleatorio: () => 0.5 });

    expect(lento.velocidad).toBeCloseTo(v / 2.5, 5);
  });

  it('ya terminado no cambia', () => {
    const fin = pararPrecision({ ...crear(), posicion: 50 }, opciones);

    expect(pararPrecision(fin, opciones)).toBe(fin);
    expect(tickPrecision(fin, 9999)).toBe(fin);
  });

  it('sanea una configuración fuera de límites', () => {
    expect(sanearPrecision({ tipo: 'precision', velocidad: 99, anchoZona: 1, intentos: 0 })).toEqual({
      tipo: 'precision', velocidad: 10, anchoZona: 5, intentos: 1,
    });
  });
});
