import { IEscena } from '@models/escena.interfaces';

/**
 * Etiquetas de las escenas: el autor las usa para agruparlas y filtrarlas en el editor (el motor no las usa).
 * Funciones puras, sin Angular. Los límites son los del servidor (`EscenaEtiquetas.cs`): mantenerlos iguales.
 */

export const MAX_ETIQUETAS = 10;
export const MAX_LONGITUD_ETIQUETA = 30;

/** Recorta y junta los espacios; el servidor hace lo mismo al guardar. */
export const limpiarEtiqueta = (texto: string): string => texto.replace(/\s+/g, ' ').trim();

const clave = (etiqueta: string): string => etiqueta.toLowerCase();
const porNombre = (a: string, b: string): number => a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });

/**
 * Añade a `actuales` lo que el autor escribió: admite varias separadas por coma (al pegar), descarta vacías y repetidas sin distinguir
 * mayúsculas, acorta las que pasan del máximo y se detiene al llegar al tope. Si coincide con una de `existentes` (las de otras escenas)
 * sin distinguir mayúsculas, se escribe como esa, para no acumular variantes de la misma etiqueta. No modifica la lista recibida.
 */
export function agregarEtiquetas(actuales: readonly string[], texto: string, existentes: readonly string[] = []): string[] {
  const resultado = [...actuales];

  for (const parte of texto.split(',')) {
    const escrita = limpiarEtiqueta(parte).slice(0, MAX_LONGITUD_ETIQUETA).trim();
    const etiqueta = existentes.find(e => clave(e) === clave(escrita)) ?? escrita;
    if (!etiqueta || resultado.some(e => clave(e) === clave(etiqueta))) continue;
    if (resultado.length >= MAX_ETIQUETAS) break;
    resultado.push(etiqueta);
  }

  return resultado;
}

export const quitarEtiqueta = (actuales: readonly string[], etiqueta: string): string[] =>
  actuales.filter(e => clave(e) !== clave(etiqueta));

export const tieneEtiqueta = (escena: Pick<IEscena, 'etiquetas'>, etiqueta: string): boolean =>
  (escena.etiquetas ?? []).some(e => clave(e) === clave(etiqueta));

/** Las etiquetas distintas de todas las escenas, ordenadas por nombre. Si dos escenas la escriben distinto, gana la primera escritura. */
export function etiquetasDe(escenas: readonly Pick<IEscena, 'etiquetas'>[]): string[] {
  const vistas = new Map<string, string>();

  for (const escena of escenas) {
    for (const etiqueta of escena.etiquetas ?? []) {
      if (!vistas.has(clave(etiqueta))) vistas.set(clave(etiqueta), etiqueta);
    }
  }

  return [...vistas.values()].sort(porNombre);
}

/** Las escenas que tienen alguna de las etiquetas elegidas (la unión de los grupos); sin selección, todas. Conserva el orden original. */
export function filtrarPorEtiquetas<T extends Pick<IEscena, 'etiquetas'>>(escenas: readonly T[], seleccionadas: readonly string[]): T[] {
  return seleccionadas.length === 0 ? [...escenas] : escenas.filter(e => seleccionadas.some(s => tieneEtiqueta(e, s)));
}

/** Quita de la selección las etiquetas que ya no usa ninguna escena (p. ej. tras quitarla de la última que la tenía). */
export function depurarSeleccion(seleccionadas: readonly string[], disponibles: readonly string[]): string[] {
  return seleccionadas.filter(s => disponibles.some(d => clave(d) === clave(s)));
}

/** Alterna una etiqueta en la selección sin modificar la recibida. */
export const alternarSeleccion = (seleccionadas: readonly string[], etiqueta: string): string[] =>
  seleccionadas.some(s => clave(s) === clave(etiqueta)) ? quitarEtiqueta(seleccionadas, etiqueta) : [...seleccionadas, etiqueta];

export interface IGrupoEscenas<T> {
  /** `null` es el grupo de las escenas sin etiqueta. */
  etiqueta: string | null;
  escenas: T[];
}

/**
 * Una escena aparece en el grupo de cada una de sus etiquetas. Los grupos van ordenados por nombre y el de "sin etiqueta" al final.
 * Con `soloEtiquetas` solo se forman esos grupos (y no el de sin etiqueta): sirve para agrupar únicamente lo que el autor filtró.
 */
export function agruparPorEtiqueta<T extends Pick<IEscena, 'etiquetas'>>(escenas: readonly T[], soloEtiquetas?: readonly string[]): IGrupoEscenas<T>[] {
  const etiquetas = soloEtiquetas?.length ? [...soloEtiquetas].sort(porNombre) : etiquetasDe(escenas);
  const grupos: IGrupoEscenas<T>[] = etiquetas
    .map(etiqueta => ({ etiqueta, escenas: escenas.filter(e => tieneEtiqueta(e, etiqueta)) }))
    .filter(g => g.escenas.length > 0);

  if (!soloEtiquetas?.length) {
    const sinEtiqueta = escenas.filter(e => (e.etiquetas ?? []).length === 0);
    if (sinEtiqueta.length > 0) grupos.push({ etiqueta: null, escenas: sinEtiqueta });
  }

  return grupos;
}
