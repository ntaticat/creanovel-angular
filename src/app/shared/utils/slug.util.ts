/**
 * Convierte un nombre ("Llave de la biblioteca") en un id válido para el motor (`llave_de_la_biblioteca`):
 * minúsculas, sin acentos, solo letras, números y guion bajo, empezando con letra y de hasta 40 caracteres.
 */
export function slugId(nombre: string, prefijo = 'x'): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!base) {
    return '';
  }

  const conLetra = /^[a-z]/.test(base) ? base : `${prefijo}_${base}`;
  return conLetra.slice(0, 40).replace(/_+$/g, '');
}
