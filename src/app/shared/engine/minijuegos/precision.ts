import { IMinijuegoPrecision } from '@models/motor.interfaces';
import { acotar, entero, factor, IEstadoBase, IOpcionesMinijuego } from './comun';

export interface IEstadoPrecision extends IEstadoBase {
  tipo: 'precision';
  config: IMinijuegoPrecision;
  /** Posición del marcador en la barra, en % (0–100). */
  posicion: number;
  direccion: 1 | -1;
  /** Velocidad del marcador en % por segundo, ya con el factor de tiempo. */
  velocidad: number;
  /** Zona objetivo: donde hay que parar el marcador. */
  zona: { inicio: number; ancho: number };
  /** Intento actual (1 = el primero). */
  intento: number;
  ultimoTick: number;
  /** Última parada fallida, para que la interfaz pueda mostrarla. */
  ultimaParada?: number;
}

export function sanearPrecision(config: IMinijuegoPrecision): IMinijuegoPrecision {
  return {
    tipo: 'precision',
    velocidad: entero(config.velocidad, 1, 10, 5),
    anchoZona: entero(config.anchoZona, 5, 60, 20),
    intentos: entero(config.intentos, 1, 10, 3),
  };
}

/** Velocidad del marcador en % por segundo para el nivel de velocidad 1–10. */
export function velocidadPorSegundo(nivel: number): number {
  return 20 + nivel * 15;
}

function nuevaZona(ancho: number, aleatorio: () => number): { inicio: number; ancho: number } {
  return { inicio: aleatorio() * (100 - ancho), ancho };
}

export function crearPrecision(config: IMinijuegoPrecision, ahora: number, opciones: IOpcionesMinijuego): IEstadoPrecision {
  const c = sanearPrecision(config);
  return {
    tipo: 'precision',
    config: c,
    posicion: 0,
    direccion: 1,
    // Con más tiempo el marcador va más despacio; el mínimo evita que se quede casi parado.
    velocidad: velocidadPorSegundo(c.velocidad) / factor(opciones),
    zona: nuevaZona(c.anchoZona, opciones.aleatorio),
    intento: 1,
    ultimoTick: ahora,
    terminado: false,
    exito: false,
    puntaje: 0,
  };
}

/** Mueve el marcador por el tiempo transcurrido; rebota en los extremos. */
export function tickPrecision(estado: IEstadoPrecision, ahora: number): IEstadoPrecision {
  if (estado.terminado) {
    return estado;
  }

  const distancia = ((ahora - estado.ultimoTick) / 1000) * estado.velocidad;
  let posicion = estado.posicion;
  let direccion = estado.direccion;
  let restante = distancia;

  // Un tick muy largo puede cruzar la barra varias veces: se recorre rebote a rebote.
  for (let i = 0; i < 1000 && restante > 0; i++) {
    const hastaBorde = direccion === 1 ? 100 - posicion : posicion;
    if (restante <= hastaBorde) {
      posicion += direccion * restante;
      restante = 0;
    } else {
      posicion += direccion * hastaBorde;
      restante -= hastaBorde;
      direccion = direccion === 1 ? -1 : 1;
    }
  }

  return { ...estado, posicion: acotar(posicion, 0, 100), direccion, ultimoTick: ahora };
}

/** El jugador para el marcador. Acierta si está dentro de la zona; si no, gasta un intento y la zona cambia de sitio. */
export function pararPrecision(estado: IEstadoPrecision, opciones: IOpcionesMinijuego): IEstadoPrecision {
  if (estado.terminado) {
    return estado;
  }

  const dentro = estado.posicion >= estado.zona.inicio && estado.posicion <= estado.zona.inicio + estado.zona.ancho;

  if (dentro) {
    return { ...estado, terminado: true, exito: true, puntaje: 1, ultimaParada: estado.posicion };
  }

  if (estado.intento >= estado.config.intentos) {
    return { ...estado, terminado: true, exito: false, puntaje: 0, ultimaParada: estado.posicion };
  }

  return {
    ...estado,
    intento: estado.intento + 1,
    zona: nuevaZona(estado.config.anchoZona, opciones.aleatorio),
    ultimaParada: estado.posicion,
  };
}
