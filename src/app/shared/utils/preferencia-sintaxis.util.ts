/** Cómo prefiere el autor editar condiciones y efectos: con el editor visual de filas o escribiéndolos como texto. */
export type ModoSintaxis = 'visual' | 'texto';

const CLAVE = 'creanovel.editor.sintaxis';
let enMemoria: ModoSintaxis = 'visual';

/** La preferencia guardada en este navegador (por defecto, el editor visual). Solo si el almacenamiento no está disponible vale la de la página. */
export function leerModoSintaxis(): ModoSintaxis {
  try {
    return localStorage.getItem(CLAVE) === 'texto' ? 'texto' : 'visual';
  } catch {
    return enMemoria;
  }
}

export function guardarModoSintaxis(modo: ModoSintaxis): void {
  enMemoria = modo;
  try {
    localStorage.setItem(CLAVE, modo);
  } catch {
    // Sin almacenamiento: queda en memoria.
  }
}

/** Línea y columna (desde 1) de una posición de un texto, para señalar errores en textos de varias líneas. */
export function lineaYColumna(texto: string, posicion: number): { linea: number; columna: number } {
  const antes = texto.slice(0, Math.max(0, posicion));
  const saltos = antes.split('\n');
  return { linea: saltos.length, columna: saltos[saltos.length - 1].length + 1 };
}
