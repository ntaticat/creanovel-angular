import { IMinijuegoConfig, IResultadoMinijuego } from '@models/motor.interfaces';
import { IOpcionesMinijuego, OPCIONES_POR_DEFECTO } from './comun';
import { acertarReflejo, crearReflejo, IEstadoReflejo, sanearReflejo, tickReflejo } from './reflejo';
import { crearPrecision, IEstadoPrecision, pararPrecision, sanearPrecision, tickPrecision } from './precision';
import { crearSecuencia, IEstadoSecuencia, sanearSecuencia, teclaSecuencia, TeclaSecuencia, tickSecuencia } from './secuencia';
import { crearPulsaciones, IEstadoPulsaciones, pulsar, sanearPulsaciones, tickPulsaciones } from './pulsaciones';

export type IEstadoMinijuego = IEstadoReflejo | IEstadoPrecision | IEstadoSecuencia | IEstadoPulsaciones;

/** Lo que puede hacer el jugador. Cada minijuego atiende solo los eventos que le corresponden. */
export type IEventoMinijuego =
  | { tipo: 'acierto' }
  | { tipo: 'parar' }
  | { tipo: 'tecla'; tecla: TeclaSecuencia }
  | { tipo: 'pulsar' };

/**
 * Minijuegos como máquinas de estado puras: no tienen reloj ni DOM. Quien los ejecuta les pasa la hora (`ahora`, en ms)
 * en cada `tick` y cada evento, así se prueban con tiempos exactos y el componente solo dibuja y captura entradas.
 */
export function crearMinijuego(
  config: IMinijuegoConfig,
  ahora: number,
  opciones: IOpcionesMinijuego = OPCIONES_POR_DEFECTO
): IEstadoMinijuego {
  switch (config.tipo) {
    case 'reflejo':
      return crearReflejo(config, ahora, opciones);
    case 'precision':
      return crearPrecision(config, ahora, opciones);
    case 'secuencia':
      return crearSecuencia(config, ahora, opciones);
    default:
      return crearPulsaciones(config, ahora, opciones);
  }
}

export function tickMinijuego(estado: IEstadoMinijuego, ahora: number): IEstadoMinijuego {
  switch (estado.tipo) {
    case 'reflejo':
      return tickReflejo(estado, ahora);
    case 'precision':
      return tickPrecision(estado, ahora);
    case 'secuencia':
      return tickSecuencia(estado, ahora);
    default:
      return tickPulsaciones(estado, ahora);
  }
}

export function eventoMinijuego(
  estado: IEstadoMinijuego,
  evento: IEventoMinijuego,
  ahora: number,
  opciones: IOpcionesMinijuego = OPCIONES_POR_DEFECTO
): IEstadoMinijuego {
  switch (estado.tipo) {
    case 'reflejo':
      return evento.tipo === 'acierto' ? acertarReflejo(estado, ahora) : estado;
    case 'precision':
      return evento.tipo === 'parar' ? pararPrecision(estado, opciones) : estado;
    case 'secuencia':
      return evento.tipo === 'tecla' ? teclaSecuencia(estado, evento.tecla) : estado;
    default:
      return evento.tipo === 'pulsar' ? pulsar(estado) : estado;
  }
}

export function resultadoDe(estado: IEstadoMinijuego): IResultadoMinijuego | undefined {
  return estado.terminado ? { exito: estado.exito, puntaje: estado.puntaje } : undefined;
}

/** Omitir cuenta como éxito con el puntaje máximo: quien no puede jugar el minijuego no queda bloqueado. */
export function resultadoOmitido(config: IMinijuegoConfig): IResultadoMinijuego {
  switch (config.tipo) {
    case 'reflejo':
      return { exito: true, puntaje: sanearReflejo(config).objetivos };
    case 'precision':
      return { exito: true, puntaje: 1 };
    case 'secuencia':
      return { exito: true, puntaje: sanearSecuencia(config).longitud };
    default:
      return { exito: true, puntaje: sanearPulsaciones(config).objetivo };
  }
}

/** Puntaje máximo posible: los minijuegos de precisión usan 1 (acertó) o 0. */
export function puntajeMaximo(config: IMinijuegoConfig): number {
  return resultadoOmitido(config).puntaje;
}

export const NOMBRES_MINIJUEGO: Record<IMinijuegoConfig['tipo'], string> = {
  reflejo: 'Reflejo',
  precision: 'Precisión',
  secuencia: 'Secuencia',
  pulsaciones: 'Pulsaciones',
};

/** Texto corto para listas y el mapa: `Reflejo: 4 de 5 objetivos`. */
export function describirMinijuego(config: IMinijuegoConfig | null | undefined): string {
  if (!config) {
    return '(sin minijuego)';
  }

  switch (config.tipo) {
    case 'reflejo': {
      const c = sanearReflejo(config);
      return `Reflejo: ${c.aciertosNecesarios} de ${c.objetivos} objetivos`;
    }
    case 'precision': {
      const c = sanearPrecision(config);
      return `Precisión: ${c.intentos} intento${c.intentos === 1 ? '' : 's'}`;
    }
    case 'secuencia': {
      const c = sanearSecuencia(config);
      return `Secuencia: ${c.longitud} flechas`;
    }
    case 'pulsaciones': {
      const c = sanearPulsaciones(config);
      return `Pulsaciones: ${c.objetivo}`;
    }
    default:
      return '(minijuego desconocido)';
  }
}
