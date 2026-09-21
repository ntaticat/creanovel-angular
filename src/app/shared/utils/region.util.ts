import { IRegion } from '@models/motor.interfaces';

/** Tamaño mínimo de una zona, en % del escenario: más pequeña sería imposible de pulsar. */
export const TAMANO_MINIMO = 2;

export interface IPunto {
  x: number;
  y: number;
}

const acotar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));
const redondear = (valor: number) => Math.round(valor * 10) / 10;

/** Ajusta una región para que quede dentro del escenario (0 a 100 %) y con el tamaño mínimo. */
export function limitarRegion(region: IRegion): IRegion {
  const ancho = acotar(region.ancho, TAMANO_MINIMO, 100);
  const alto = acotar(region.alto, TAMANO_MINIMO, 100);
  return {
    x: redondear(acotar(region.x, 0, 100 - ancho)),
    y: redondear(acotar(region.y, 0, 100 - alto)),
    ancho: redondear(ancho),
    alto: redondear(alto),
  };
}

/** Convierte una posición de pantalla en % del escenario (acotado a 0–100). */
export function puntoEnPorcentaje(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): IPunto {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: acotar(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: acotar(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

/** El rectángulo que va de un punto a otro, sin importar en qué dirección se arrastró. */
export function regionDesdeArrastre(a: IPunto, b: IPunto): IRegion {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    ancho: Math.abs(a.x - b.x),
    alto: Math.abs(a.y - b.y),
  };
}

/** ¿El arrastre fue lo bastante grande para ser una zona y no un simple clic? */
export function esZonaValida(region: IRegion): boolean {
  return region.ancho >= TAMANO_MINIMO && region.alto >= TAMANO_MINIMO;
}

/** Mueve la región conservando su tamaño; no se sale del escenario. */
export function moverRegion(region: IRegion, dx: number, dy: number): IRegion {
  return limitarRegion({ ...region, x: region.x + dx, y: region.y + dy });
}

/** Cambia el tamaño moviendo la esquina inferior derecha; no se sale del escenario ni baja del mínimo. */
export function redimensionarRegion(region: IRegion, dx: number, dy: number): IRegion {
  return limitarRegion({
    ...region,
    ancho: Math.min(region.ancho + dx, 100 - region.x),
    alto: Math.min(region.alto + dy, 100 - region.y),
  });
}
