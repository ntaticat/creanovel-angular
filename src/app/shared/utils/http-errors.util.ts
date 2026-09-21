import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensajes de un error del backend. Las validaciones responden `{ errors: { message, errores: [...] } }`;
 * cualquier otra forma cae al mensaje genérico recibido.
 */
export function extraerErrores(error: unknown, generico: string): string[] {
  const detalle = (error as HttpErrorResponse | undefined)?.error?.errors;

  if (Array.isArray(detalle?.errores) && detalle.errores.length) {
    return detalle.errores.map((e: unknown) => (typeof e === 'string' ? e : (e as { mensaje?: string }).mensaje ?? generico));
  }

  return [typeof detalle?.message === 'string' ? detalle.message : generico];
}
