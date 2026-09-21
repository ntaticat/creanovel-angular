import { IMinijuegoReflejo } from '@models/motor.interfaces';
import { acotar, entero, factor, IEstadoBase, IOpcionesMinijuego } from './comun';

export interface IObjetivoReflejo {
  /** Posición del centro, en % del área de juego. */
  x: number;
  y: number;
}

export interface IEstadoReflejo extends IEstadoBase {
  tipo: 'reflejo';
  config: IMinijuegoReflejo;
  /** Cuánto dura cada objetivo, ya con el factor de tiempo. */
  duracionMs: number;
  objetivos: IObjetivoReflejo[];
  /** Objetivo visible ahora. */
  indice: number;
  apareceEn: number;
  aciertos: number;
}

export function sanearReflejo(config: IMinijuegoReflejo): IMinijuegoReflejo {
  const objetivos = entero(config.objetivos, 1, 20, 3);
  return {
    tipo: 'reflejo',
    objetivos,
    aciertosNecesarios: entero(config.aciertosNecesarios, 1, objetivos, objetivos),
    duracionMs: entero(config.duracionMs, 400, 10000, 1500),
  };
}

export function crearReflejo(config: IMinijuegoReflejo, ahora: number, opciones: IOpcionesMinijuego): IEstadoReflejo {
  const c = sanearReflejo(config);
  // Lejos de los bordes para que el objetivo siempre quepa entero y se pueda pulsar.
  const objetivos = Array.from({ length: c.objetivos }, () => ({
    x: 12 + opciones.aleatorio() * 76,
    y: 18 + opciones.aleatorio() * 64,
  }));

  return {
    tipo: 'reflejo',
    config: c,
    duracionMs: c.duracionMs * factor(opciones),
    objetivos,
    indice: 0,
    apareceEn: ahora,
    aciertos: 0,
    terminado: false,
    exito: false,
    puntaje: 0,
  };
}

function avanzar(estado: IEstadoReflejo, aciertos: number, apareceEn: number): IEstadoReflejo {
  const indice = estado.indice + 1;
  const restantes = estado.objetivos.length - indice;
  const alcanzable = aciertos + restantes >= estado.config.aciertosNecesarios;

  // Se termina en cuanto ya no queden objetivos o ya no se pueda llegar a los aciertos necesarios.
  if (restantes <= 0 || !alcanzable) {
    return {
      ...estado,
      indice: Math.min(indice, estado.objetivos.length),
      aciertos,
      terminado: true,
      exito: aciertos >= estado.config.aciertosNecesarios,
      puntaje: aciertos,
    };
  }

  return { ...estado, indice, aciertos, apareceEn };
}

/** El jugador pulsó el objetivo visible. */
export function acertarReflejo(estado: IEstadoReflejo, ahora: number): IEstadoReflejo {
  return estado.terminado ? estado : avanzar(estado, estado.aciertos + 1, ahora);
}

/** Un objetivo que no se pulsa a tiempo se pierde. Si el reloj llegó tarde (pestaña dormida) se pierden todos los que correspondan. */
export function tickReflejo(estado: IEstadoReflejo, ahora: number): IEstadoReflejo {
  let actual = estado;
  for (let i = 0; i < estado.objetivos.length && !actual.terminado && ahora - actual.apareceEn >= actual.duracionMs; i++) {
    actual = avanzar(actual, actual.aciertos, actual.apareceEn + actual.duracionMs);
  }
  return actual;
}

/** Fracción (0–1) del tiempo que le queda al objetivo visible, para animar el aro que se encoge. */
export function fraccionRestanteReflejo(estado: IEstadoReflejo, ahora: number): number {
  return acotar(1 - (ahora - estado.apareceEn) / estado.duracionMs, 0, 1);
}
