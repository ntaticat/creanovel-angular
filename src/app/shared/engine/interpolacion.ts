import { IDefiniciones, IEstadoJuego } from '@models/motor.interfaces';
import { evaluarCondicion } from './condiciones';
import { cantidadDe } from './estado';
import { IErrorSintaxis, parsearCondicion } from './sintaxis';

/**
 * Variables dentro de los textos que ve el jugador (mensajes, opciones, zonas, preguntas, finales):
 *
 *   {salud}                        valor de una variable (sí/no se muestra «sí» o «no»)
 *   {objeto:llave}                 cuántas unidades se tienen de un objeto
 *   {ubicacion}                    nombre del lugar donde está el jugador
 *   {si salud < 30: mal | bien}    texto según una condición (la misma sintaxis que las condiciones); el «| ...» es opcional.
 *                                  Con «|» se recortan los espacios de cada texto; sin él se respeta lo escrito (útil para añadir
 *                                  una frase con su espacio: «Ana{si tiene_pareja: y su pareja}.»)
 *   {{  }}                         llaves literales (solo fuera de un bloque)
 *
 * Es una plantilla cerrada, no código: lo que no se entiende (una variable que no existe, un bloque mal escrito) se deja
 * tal cual en el texto en vez de romper la escena. El editor avisa de esos casos con `validarPlantilla`.
 */
export type Segmento =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'var'; clave: string; cruda: string; pos: number; len: number }
  | { tipo: 'objeto'; id: string; cruda: string; pos: number; len: number }
  | { tipo: 'ubicacion'; cruda: string; pos: number; len: number }
  | {
      tipo: 'si';
      condicion: string;
      /** Posición (en el texto completo) donde empieza la condición, para ubicar sus errores. */
      posCondicion: number;
      entonces: Segmento[];
      sino: Segmento[];
      cruda: string;
      pos: number;
      len: number;
    }
  | { tipo: 'invalido'; cruda: string; mensaje: string; pos: number; len: number };

const CLAVE = /^[a-z][a-z0-9_]*$/;
const CACHE_MAX = 500;
const cache = new Map<string, Segmento[]>();

/** Posición de la llave que cierra la que se abre en `abre`, contando las anidadas. -1 si no se cierra. */
function cerrar(texto: string, abre: number, hasta: number): number {
  let profundidad = 0;
  for (let i = abre; i < hasta; i++) {
    if (texto[i] === '{') profundidad++;
    else if (texto[i] === '}' && --profundidad === 0) return i;
  }
  return -1;
}

/** Posición de `caracter` en el nivel más externo de `texto[desde..hasta)`, fuera de llaves y de comillas. -1 si no está. */
function buscarPlano(texto: string, caracter: string, desde: number, hasta: number): number {
  let profundidad = 0;
  let comilla = '';
  for (let i = desde; i < hasta; i++) {
    const c = texto[i];
    if (comilla) {
      if (c === comilla) comilla = '';
    } else if (c === '"' || c === "'" || c === '“') {
      // Una comilla sola dentro de una frase ("l'eau") no debe tragarse el resto: solo cuenta si se cierra en el bloque.
      const cierre = c === '“' ? '”' : c;
      if (texto.indexOf(cierre, i + 1) !== -1 && texto.indexOf(cierre, i + 1) < hasta) comilla = cierre;
    } else if (c === '{') profundidad++;
    else if (c === '}') profundidad--;
    else if (c === caracter && profundidad === 0) return i;
  }
  return -1;
}

function parsearRango(texto: string, desde: number, hasta: number): Segmento[] {
  const segmentos: Segmento[] = [];
  let literal = '';
  let i = desde;

  const volcar = () => {
    if (literal) segmentos.push({ tipo: 'texto', texto: literal });
    literal = '';
  };

  while (i < hasta) {
    const c = texto[i];

    if (c === '{' && texto[i + 1] === '{') {
      literal += '{';
      i += 2;
    } else if (c === '}' && texto[i + 1] === '}') {
      literal += '}';
      i += 2;
    } else if (c === '{') {
      const fin = cerrar(texto, i, hasta);
      volcar();
      if (fin === -1) {
        segmentos.push({ tipo: 'invalido', cruda: texto.slice(i, hasta), mensaje: 'Llave sin cerrar.', pos: i, len: hasta - i });
        i = hasta;
      } else {
        segmentos.push(parsearBloque(texto, i, fin));
        i = fin + 1;
      }
    } else {
      literal += c;
      i++;
    }
  }

  volcar();
  return segmentos;
}

function parsearBloque(texto: string, abre: number, cierra: number): Segmento {
  const cruda = texto.slice(abre, cierra + 1);
  const len = cierra - abre + 1;
  const contenido = texto.slice(abre + 1, cierra);
  const limpio = contenido.trim();
  const invalido = (mensaje: string): Segmento => ({ tipo: 'invalido', cruda, mensaje, pos: abre, len });

  if (/^si(\s|$)/i.test(limpio)) {
    const inicio = abre + 1 + contenido.indexOf(limpio) + 2; // después de «si»
    const dosPuntos = buscarPlano(texto, ':', inicio, cierra);
    if (dosPuntos === -1) {
      return invalido('Falta «:» después de la condición ({si condición: texto}).');
    }

    const barra = buscarPlano(texto, '|', dosPuntos + 1, cierra);
    if (barra !== -1 && buscarPlano(texto, '|', barra + 1, cierra) !== -1) {
      return invalido('Solo puede haber una «|» (una para el texto contrario).');
    }

    // Con dos ramas se recortan los espacios de cada una (`{si a: X | Y}` no deja espacios sobrantes en mitad de una frase).
    // Con una sola se respeta lo escrito: ahí el espacio inicial suele ser el separador (`Ana{si p: y su pareja}.`).
    const recortar = (desde: number, hasta: number): [number, number] => {
      while (desde < hasta && /\s/.test(texto[desde])) desde++;
      while (hasta > desde && /\s/.test(texto[hasta - 1])) hasta--;
      return [desde, hasta];
    };
    const [entoncesDesde, entoncesHasta] = barra === -1 ? [dosPuntos + 1, cierra] : recortar(dosPuntos + 1, barra);
    const [sinoDesde, sinoHasta] = barra === -1 ? [0, 0] : recortar(barra + 1, cierra);

    return {
      tipo: 'si',
      condicion: texto.slice(inicio, dosPuntos),
      posCondicion: inicio,
      entonces: parsearRango(texto, entoncesDesde, entoncesHasta),
      sino: barra === -1 ? [] : parsearRango(texto, sinoDesde, sinoHasta),
      cruda,
      pos: abre,
      len,
    };
  }

  const objeto = /^objeto:([a-z][a-z0-9_]*)$/.exec(limpio);
  if (objeto) {
    return { tipo: 'objeto', id: objeto[1], cruda, pos: abre, len };
  }

  if (limpio === 'ubicacion') {
    return { tipo: 'ubicacion', cruda, pos: abre, len };
  }

  if (CLAVE.test(limpio)) {
    return { tipo: 'var', clave: limpio, cruda, pos: abre, len };
  }

  return invalido('No entiendo este bloque: usa {variable}, {objeto:id}, {ubicacion} o {si condición: texto | otro}.');
}

/** Descompone un texto en segmentos. Nunca lanza: lo que no se entiende queda como segmento inválido. */
export function parsearPlantilla(texto: string): Segmento[] {
  const guardado = cache.get(texto);
  if (guardado) {
    return guardado;
  }

  const segmentos = parsearRango(texto, 0, texto.length);
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(texto, segmentos);
  return segmentos;
}

export function formatearNumero(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

const condiciones = new WeakMap<IDefiniciones, Map<string, ReturnType<typeof parsearCondicion>>>();

function condicionDe(texto: string, defs: IDefiniciones) {
  let porTexto = condiciones.get(defs);
  if (!porTexto) {
    porTexto = new Map();
    condiciones.set(defs, porTexto);
  }
  let resultado = porTexto.get(texto);
  if (!resultado) {
    resultado = parsearCondicion(texto, defs);
    if (porTexto.size >= CACHE_MAX) porTexto.clear();
    porTexto.set(texto, resultado);
  }
  return resultado;
}

function dibujar(segmentos: Segmento[], estado: IEstadoJuego, defs: IDefiniciones): string {
  return segmentos
    .map(s => {
      switch (s.tipo) {
        case 'texto':
          return s.texto;

        case 'var': {
          const def = defs.variables.find(v => v.clave === s.clave);
          const valor = def ? estado.vars[s.clave] : undefined;
          if (valor === undefined) return s.cruda;
          return typeof valor === 'number' ? formatearNumero(valor) : typeof valor === 'boolean' ? (valor ? 'sí' : 'no') : valor;
        }

        case 'objeto':
          return defs.objetos?.some(o => o.id === s.id) ? String(cantidadDe(estado, s.id)) : s.cruda;

        case 'ubicacion':
          return defs.ubicaciones?.find(u => u.id === estado.ubicacion)?.nombre ?? 'ningún lugar';

        case 'si': {
          const { condicion, errores } = condicionDe(s.condicion, defs);
          if (errores.length) return s.cruda;
          return dibujar(evaluarCondicion(condicion, estado) ? s.entonces : s.sino, estado, defs);
        }

        default:
          return s.cruda;
      }
    })
    .join('');
}

/** El texto con las variables sustituidas por sus valores actuales. Un texto sin llaves se devuelve tal cual. */
export function interpolar(texto: string, estado: IEstadoJuego, defs: IDefiniciones | null | undefined): string {
  if (!texto || (!texto.includes('{') && !texto.includes('}'))) {
    return texto;
  }
  return dibujar(parsearPlantilla(texto), estado, defs ?? { variables: [] });
}

function sugerir(nombre: string, candidatos: string[]): string {
  const cercano = candidatos.find(c => c.startsWith(nombre) || nombre.startsWith(c));
  return cercano ? ` ¿Quisiste decir «${cercano}»?` : '';
}

function revisar(segmentos: Segmento[], defs: IDefiniciones, errores: IErrorSintaxis[]): void {
  for (const s of segmentos) {
    switch (s.tipo) {
      case 'var':
        if (!defs.variables.some(v => v.clave === s.clave) && s.clave !== 'ubicacion') {
          errores.push({
            mensaje: `La variable «${s.clave}» no está definida.${sugerir(s.clave, defs.variables.map(v => v.clave))}`,
            posicion: s.pos,
            longitud: s.len,
          });
        }
        break;

      case 'objeto':
        if (!defs.objetos?.some(o => o.id === s.id)) {
          errores.push({
            mensaje: `El objeto «${s.id}» no está definido.${sugerir(s.id, (defs.objetos ?? []).map(o => o.id))}`,
            posicion: s.pos,
            longitud: s.len,
          });
        }
        break;

      case 'si': {
        const { errores: erroresCondicion } = parsearCondicion(s.condicion, defs);
        for (const e of erroresCondicion) {
          errores.push({ mensaje: `En la condición: ${e.mensaje}`, posicion: s.posCondicion + e.posicion, longitud: e.longitud });
        }
        if (!s.condicion.trim()) {
          errores.push({ mensaje: 'Falta la condición ({si condición: texto}).', posicion: s.pos, longitud: s.len });
        }
        revisar(s.entonces, defs, errores);
        revisar(s.sino, defs, errores);
        break;
      }

      case 'invalido':
        errores.push({ mensaje: s.mensaje, posicion: s.pos, longitud: s.len });
        break;
    }
  }
}

/** Problemas de un texto con variables, para mostrarlos mientras se escribe. Vacío si todo está bien. */
export function validarPlantilla(texto: string, defs: IDefiniciones | null | undefined): IErrorSintaxis[] {
  if (!texto || (!texto.includes('{') && !texto.includes('}'))) {
    return [];
  }
  const errores: IErrorSintaxis[] = [];
  revisar(parsearPlantilla(texto), defs ?? { variables: [] }, errores);
  return errores;
}
