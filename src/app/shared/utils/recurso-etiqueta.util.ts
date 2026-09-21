import {
  instanceOfIAsigna,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
  instanceOfIEvalua,
  instanceOfIExplora,
  instanceOfIJuega,
  instanceOfITermina,
  MixRecursosType,
} from '@models/recurso.interfaces';
import { describirCondicion, describirEfectos } from 'src/app/shared/engine/texto';
import { describirMinijuego } from 'src/app/shared/engine/minijuegos/minijuego';

/** Nombre del tipo de nodo tal como lo ve el autor. */
export function nombreTipoRecurso(recurso: MixRecursosType): string {
  if (instanceOfIConversacion(recurso)) return 'Habla';
  if (instanceOfIDecision(recurso)) return 'Selecciona';
  if (instanceOfIEvalua(recurso)) return 'Evalúa';
  if (instanceOfIAsigna(recurso)) return 'Asigna';
  if (instanceOfIExplora(recurso)) return 'Explora';
  if (instanceOfIJuega(recurso)) return 'Juega';
  if (instanceOfITermina(recurso)) return 'Termina';
  if (instanceOfIEntrada(recurso)) return 'Pide';
  return 'Recurso';
}

/** Una línea de texto que resume el contenido del nodo, para listas, selects y el mapa. */
export function resumenRecurso(recurso: MixRecursosType): string {
  if (instanceOfIConversacion(recurso)) return recurso.mensaje || '';
  if (instanceOfIDecision(recurso)) return recurso.decisionMensaje || '';
  if (instanceOfIEntrada(recurso)) return recurso.etiqueta || '';
  if (instanceOfIEvalua(recurso)) {
    const ramas = (recurso.opciones ?? []).filter(o => o.tipo === 'rama');
    return ramas.length
      ? ramas.map(r => `si ${describirCondicion(r.condicion)}`).join(' · ')
      : '(sin ramas)';
  }
  if (instanceOfIAsigna(recurso)) return describirEfectos(recurso.efectos) || '(sin efectos)';
  if (instanceOfIJuega(recurso)) return describirMinijuego(recurso.minijuego);
  if (instanceOfITermina(recurso)) return `Final: ${recurso.final || '(sin elegir)'}`;
  if (instanceOfIExplora(recurso)) {
    const zonas = (recurso.opciones ?? []).filter(o => o.tipo === 'zona');
    return recurso.mensaje || (zonas.length ? zonas.map(z => z.opcionMensaje).join(' · ') : '(sin zonas)');
  }
  return '';
}
