import { IMetaDef, IObjetoDef, IUbicacionDef, IVariableDef } from '@models/motor.interfaces';

/**
 * Título y resumen de una línea de cada elemento del "mundo" (variable, objeto, ubicación, logro, final) para mostrarlos plegados:
 * lo que hace falta para reconocerlo sin abrirlo. Funciones puras, sin Angular.
 */

const TIPOS_VARIABLE = { numero: 'número', booleano: 'sí / no', texto: 'texto' } as const;

const limpio = (texto?: string | null) => (texto ?? '').trim();
const acortar = (texto: string, max: number) => (texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto);
/** El identificador solo aporta si el nombre visible lo oculta. */
const idAparte = (nombre: string, id: string) => (id && nombre && nombre !== id ? [id] : []);

export function tituloVariable(v: IVariableDef): string {
  return limpio(v.etiqueta) || v.clave || 'Variable nueva';
}

export function resumirVariable(v: IVariableDef): string {
  const partes: string[] = [...idAparte(limpio(v.etiqueta), v.clave), TIPOS_VARIABLE[v.tipo] ?? v.tipo];

  if (v.tipo === 'numero') {
    if (v.min != null || v.max != null) {
      partes.push(`${v.min ?? '…'}–${v.max ?? '…'}`);
    }
    partes.push(`inicial ${v.inicial ?? 0}`);
  } else if (v.tipo === 'booleano') {
    partes.push(v.inicial ? 'empieza en sí' : 'empieza en no');
  } else {
    if (v.valores?.length) partes.push(`${v.valores.length} valores`);
    if (v.inicial) partes.push(`inicial «${v.inicial}»`);
  }

  if (v.hud === 'barra') partes.push('con barra');
  else if (v.hud === 'numero') partes.push('visible');

  return partes.join(' · ');
}

export function tituloObjeto(o: IObjetoDef): string {
  return limpio(o.nombre) || o.id || 'Objeto nuevo';
}

export function resumirObjeto(o: IObjetoDef): string {
  const partes: string[] = [...idAparte(limpio(o.nombre), o.id)];
  partes.push(o.apilable ? (o.max ? `apilable (máx. ${o.max})` : 'apilable') : 'único');
  if (o.inicial > 0) partes.push(`${o.inicial} al empezar`);
  if (o.uso) partes.push(`se usa: ${limpio(o.uso.etiqueta) || 'Usar'}`);
  return partes.join(' · ');
}

export function tituloUbicacion(u: IUbicacionDef): string {
  return limpio(u.nombre) || u.id || 'Ubicación nueva';
}

export function resumirUbicacion(u: IUbicacionDef, esInicial: boolean): string {
  const partes: string[] = [...idAparte(limpio(u.nombre), u.id)];
  if (esInicial) partes.push('empieza aquí');
  if (u.backgroundSpriteId) partes.push('con fondo');
  return partes.join(' · ');
}

export function tituloMeta(m: IMetaDef, tipo: 'logro' | 'final'): string {
  return limpio(m.nombre) || m.id || `${tipo === 'logro' ? 'Logro' : 'Final'} nuevo`;
}

export function resumirMeta(m: IMetaDef): string {
  const descripcion = limpio(m.descripcion);
  return [...idAparte(limpio(m.nombre), m.id), ...(descripcion ? [acortar(descripcion, 50)] : [])].join(' · ');
}
