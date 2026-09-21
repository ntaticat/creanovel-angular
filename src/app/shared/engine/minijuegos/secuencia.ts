import { IMinijuegoSecuencia } from '@models/motor.interfaces';
import { entero, factor, IEstadoBase, IOpcionesMinijuego } from './comun';

export type TeclaSecuencia = 'izquierda' | 'arriba' | 'derecha' | 'abajo';
export const TECLAS: TeclaSecuencia[] = ['izquierda', 'arriba', 'derecha', 'abajo'];

/** Las teclas del navegador que cuentan, y a qué flecha corresponden. */
export function teclaDesdeEvento(key: string): TeclaSecuencia | undefined {
  switch (key) {
    case 'ArrowLeft':
      return 'izquierda';
    case 'ArrowUp':
      return 'arriba';
    case 'ArrowRight':
      return 'derecha';
    case 'ArrowDown':
      return 'abajo';
    default:
      return undefined;
  }
}

export interface IEstadoSecuencia extends IEstadoBase {
  tipo: 'secuencia';
  config: IMinijuegoSecuencia;
  secuencia: TeclaSecuencia[];
  /** Cuántas van bien; la siguiente a pulsar es `secuencia[indice]`. */
  indice: number;
  inicioEn: number;
  limiteMs: number;
}

export function sanearSecuencia(config: IMinijuegoSecuencia): IMinijuegoSecuencia {
  return {
    tipo: 'secuencia',
    longitud: entero(config.longitud, 2, 12, 4),
    tiempoMs: entero(config.tiempoMs, 1000, 60000, 6000),
  };
}

export function crearSecuencia(config: IMinijuegoSecuencia, ahora: number, opciones: IOpcionesMinijuego): IEstadoSecuencia {
  const c = sanearSecuencia(config);
  return {
    tipo: 'secuencia',
    config: c,
    secuencia: Array.from({ length: c.longitud }, () => TECLAS[Math.floor(opciones.aleatorio() * TECLAS.length) % TECLAS.length]),
    indice: 0,
    inicioEn: ahora,
    limiteMs: c.tiempoMs * factor(opciones),
    terminado: false,
    exito: false,
    puntaje: 0,
  };
}

/** Una flecha equivocada termina el intento; acertarlas todas gana. */
export function teclaSecuencia(estado: IEstadoSecuencia, tecla: TeclaSecuencia): IEstadoSecuencia {
  if (estado.terminado) {
    return estado;
  }

  if (tecla !== estado.secuencia[estado.indice]) {
    return { ...estado, terminado: true, exito: false, puntaje: estado.indice };
  }

  const indice = estado.indice + 1;
  return indice >= estado.secuencia.length
    ? { ...estado, indice, terminado: true, exito: true, puntaje: indice }
    : { ...estado, indice, puntaje: indice };
}

export function tickSecuencia(estado: IEstadoSecuencia, ahora: number): IEstadoSecuencia {
  if (estado.terminado || ahora - estado.inicioEn < estado.limiteMs) {
    return estado;
  }
  return { ...estado, terminado: true, exito: false, puntaje: estado.indice };
}
