import { IMinijuegoPulsaciones } from '@models/motor.interfaces';
import { entero, factor, IEstadoBase, IOpcionesMinijuego } from './comun';

export interface IEstadoPulsaciones extends IEstadoBase {
  tipo: 'pulsaciones';
  config: IMinijuegoPulsaciones;
  cuenta: number;
  inicioEn: number;
  limiteMs: number;
}

export function sanearPulsaciones(config: IMinijuegoPulsaciones): IMinijuegoPulsaciones {
  return {
    tipo: 'pulsaciones',
    objetivo: entero(config.objetivo, 3, 200, 10),
    tiempoMs: entero(config.tiempoMs, 1000, 30000, 5000),
  };
}

export function crearPulsaciones(config: IMinijuegoPulsaciones, ahora: number, opciones: IOpcionesMinijuego): IEstadoPulsaciones {
  const c = sanearPulsaciones(config);
  return {
    tipo: 'pulsaciones',
    config: c,
    cuenta: 0,
    inicioEn: ahora,
    limiteMs: c.tiempoMs * factor(opciones),
    terminado: false,
    exito: false,
    puntaje: 0,
  };
}

export function pulsar(estado: IEstadoPulsaciones): IEstadoPulsaciones {
  if (estado.terminado) {
    return estado;
  }
  const cuenta = estado.cuenta + 1;
  return cuenta >= estado.config.objetivo
    ? { ...estado, cuenta, terminado: true, exito: true, puntaje: cuenta }
    : { ...estado, cuenta, puntaje: cuenta };
}

export function tickPulsaciones(estado: IEstadoPulsaciones, ahora: number): IEstadoPulsaciones {
  if (estado.terminado || ahora - estado.inicioEn < estado.limiteMs) {
    return estado;
  }
  return { ...estado, terminado: true, exito: false, puntaje: estado.cuenta };
}
