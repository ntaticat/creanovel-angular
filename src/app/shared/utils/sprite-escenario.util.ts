/**
 * Un personaje colocado en el escenario de un nodo. `x` e `y` son el centro del sprite en % del escenario (16:9);
 * `escala` multiplica el tamaño base (el sprite entero cabe en el escenario) y `espejo` lo voltea.
 */
export interface IColocacionSprite {
  x: number;
  y: number;
  escala: number;
  espejo: boolean;
}

export const ESCALA_MINIMA = 0.1;
export const ESCALA_MAXIMA = 4;
/** Máximo de personajes por escenario (el mismo tope que impone el backend). */
export const MAX_PERSONAJES_ESCENARIO = 8;

const acotar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));
const redondear = (valor: number, decimales = 1) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

/**
 * Única fuente de verdad de cómo se dibuja un sprite colocado: el escenario del jugador y el editor lo aplican igual, así que lo que el
 * autor ve al colocarlo es lo que verá el lector.
 *
 * Se aplica a un contenedor que cubre todo el escenario y centra la imagen con `object-fit: contain` (el sprite entero, sin recorte).
 * El contenedor se desplaza `x - 50`, `y - 50` (% de su propio tamaño, o sea del escenario) y se escala respecto al centro, que es el
 * del sprite: por eso `x` e `y` son el centro del sprite.
 */
export function estiloSpriteEscenario(colocacion: IColocacionSprite): Record<string, string> {
  const escalaX = colocacion.espejo ? -colocacion.escala : colocacion.escala;
  return {
    transform: `translate(${colocacion.x - 50}%, ${colocacion.y - 50}%) scale(${escalaX}, ${colocacion.escala})`,
  };
}

/** Ajusta una colocación a lo que acepta el backend: centro dentro del escenario y escala en su rango. */
export function limitarColocacion<T extends IColocacionSprite>(colocacion: T): T {
  return {
    ...colocacion,
    x: redondear(acotar(colocacion.x, 0, 100)),
    y: redondear(acotar(colocacion.y, 0, 100)),
    escala: redondear(acotar(colocacion.escala, ESCALA_MINIMA, ESCALA_MAXIMA), 2),
  };
}

/** Desplaza el sprite `dx`, `dy` (en % del escenario) sin sacar su centro del escenario. */
export function moverColocacion<T extends IColocacionSprite>(colocacion: T, dx: number, dy: number): T {
  return limitarColocacion({ ...colocacion, x: colocacion.x + dx, y: colocacion.y + dy });
}

/** Multiplica la escala por `factor` (1.1 = un 10 % más grande) dentro de los límites. */
export function escalarColocacion<T extends IColocacionSprite>(colocacion: T, factor: number): T {
  return limitarColocacion({ ...colocacion, escala: colocacion.escala * factor });
}

/** Sitios donde va apareciendo cada personaje nuevo: primero al centro y luego repartidos a los lados, para que no se tapen entre sí. */
const POSICIONES_INICIALES = [50, 25, 75, 12.5, 87.5, 37.5, 62.5, 6.25];

/** Colocación de un personaje recién añadido cuando ya hay `existentes` en el escenario. */
export function colocacionInicial(existentes: number): IColocacionSprite {
  return {
    x: POSICIONES_INICIALES[existentes % POSICIONES_INICIALES.length],
    y: 50,
    escala: 0.9,
    espejo: false,
  };
}

/** Proporción (ancho / alto) del escenario donde se colocan los personajes: la misma que fuerzan el editor y el escenario del jugador. */
export const ASPECTO_ESCENARIO = 16 / 9;

/**
 * Tamaño (en % del escenario) de la caja que ocupa un sprite de proporción `aspecto` (ancho / alto) cuando se ve entero dentro del escenario:
 * el lado limitante llena el escenario y el otro se ajusta. Sirve para que la zona donde se puede pulsar un sprite sea justo su imagen y no
 * una caja transparente del tamaño del escenario que tape a los demás.
 */
export function cajaDelSprite(aspecto: number, aspectoEscenario = ASPECTO_ESCENARIO): { ancho: number; alto: number } {
  if (!Number.isFinite(aspecto) || aspecto <= 0) {
    return { ancho: 100, alto: 100 };
  }
  return aspecto >= aspectoEscenario
    ? { ancho: 100, alto: redondear((aspectoEscenario / aspecto) * 100, 2) }
    : { ancho: redondear((aspecto / aspectoEscenario) * 100, 2), alto: 100 };
}
