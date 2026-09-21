import { IResultadoMinijuego } from '@models/motor.interfaces';

/** Opciones con las que se crea cualquier minijuego. `aleatorio` se inyecta para poder probarlos con valores fijos. */
export interface IOpcionesMinijuego {
  /** Multiplicador de tiempo para quien necesita más (1 = normal, 2.5 = modo accesible). */
  factorTiempo: number;
  aleatorio: () => number;
}

export const OPCIONES_POR_DEFECTO: IOpcionesMinijuego = {
  factorTiempo: 1,
  aleatorio: Math.random,
};

export interface IEstadoBase extends IResultadoMinijuego {
  terminado: boolean;
}

export function acotar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

/** Un entero de la configuración, acotado a los límites del backend (por si llega una versión antigua o dañada). */
export function entero(valor: unknown, min: number, max: number, pordefecto: number): number {
  const n = typeof valor === 'number' && Number.isFinite(valor) ? Math.round(valor) : pordefecto;
  return acotar(n, min, max);
}

export function factor(opciones: IOpcionesMinijuego): number {
  return acotar(Number.isFinite(opciones.factorTiempo) ? opciones.factorTiempo : 1, 1, 5);
}
