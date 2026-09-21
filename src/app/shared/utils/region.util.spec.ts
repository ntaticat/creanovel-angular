import { IRegion } from '@models/motor.interfaces';
import {
  esZonaValida,
  limitarRegion,
  moverRegion,
  puntoEnPorcentaje,
  redimensionarRegion,
  regionDesdeArrastre,
  TAMANO_MINIMO,
} from './region.util';

describe('region.util', () => {
  const region: IRegion = { x: 10, y: 20, ancho: 30, alto: 25 };

  it('puntoEnPorcentaje convierte y acota', () => {
    const rect = { left: 100, top: 50, width: 400, height: 200 };

    expect(puntoEnPorcentaje(300, 150, rect)).toEqual({ x: 50, y: 50 });
    expect(puntoEnPorcentaje(0, 0, rect)).toEqual({ x: 0, y: 0 });
    expect(puntoEnPorcentaje(9999, 9999, rect)).toEqual({ x: 100, y: 100 });
    expect(puntoEnPorcentaje(1, 1, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('regionDesdeArrastre no depende de la dirección del arrastre', () => {
    const hacia = regionDesdeArrastre({ x: 10, y: 10 }, { x: 40, y: 30 });
    const atras = regionDesdeArrastre({ x: 40, y: 30 }, { x: 10, y: 10 });

    expect(hacia).toEqual({ x: 10, y: 10, ancho: 30, alto: 20 });
    expect(atras).toEqual(hacia);
  });

  it('un arrastre pequeño no es una zona', () => {
    expect(esZonaValida({ x: 0, y: 0, ancho: 1, alto: 30 })).toBeFalse();
    expect(esZonaValida({ x: 0, y: 0, ancho: 30, alto: 1.9 })).toBeFalse();
    expect(esZonaValida({ x: 0, y: 0, ancho: TAMANO_MINIMO, alto: TAMANO_MINIMO })).toBeTrue();
  });

  it('moverRegion conserva el tamaño y no se sale del escenario', () => {
    expect(moverRegion(region, 5, -5)).toEqual({ x: 15, y: 15, ancho: 30, alto: 25 });
    expect(moverRegion(region, 500, 500)).toEqual({ x: 70, y: 75, ancho: 30, alto: 25 });
    expect(moverRegion(region, -500, -500)).toEqual({ x: 0, y: 0, ancho: 30, alto: 25 });
  });

  it('redimensionarRegion mueve la esquina inferior derecha con mínimo y máximo', () => {
    expect(redimensionarRegion(region, 10, 5)).toEqual({ x: 10, y: 20, ancho: 40, alto: 30 });
    expect(redimensionarRegion(region, 500, 500)).toEqual({ x: 10, y: 20, ancho: 90, alto: 80 });
    expect(redimensionarRegion(region, -500, -500)).toEqual({ x: 10, y: 20, ancho: TAMANO_MINIMO, alto: TAMANO_MINIMO });
  });

  it('limitarRegion deja siempre una región que el backend acepta', () => {
    const casos: IRegion[] = [
      { x: -20, y: -5, ancho: 300, alto: 0 },
      { x: 99, y: 99, ancho: 50, alto: 50 },
      { x: 33.333, y: 12.345, ancho: 10.1234, alto: 7.9999 },
    ];

    for (const caso of casos) {
      const r = limitarRegion(caso);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.ancho).toBeGreaterThan(0);
      expect(r.alto).toBeGreaterThan(0);
      expect(r.x + r.ancho).toBeLessThanOrEqual(100.0001);
      expect(r.y + r.alto).toBeLessThanOrEqual(100.0001);
    }
  });

  it('limitarRegion redondea a un decimal', () => {
    expect(limitarRegion({ x: 33.333, y: 12.345, ancho: 10.1234, alto: 7.9999 })).toEqual({ x: 33.3, y: 12.3, ancho: 10.1, alto: 8 });
  });
});
