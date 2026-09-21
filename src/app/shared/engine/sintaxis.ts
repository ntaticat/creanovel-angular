import {
  ICondicion,
  IDefiniciones,
  IEfecto,
  IVariableDef,
  OpComparacion,
  VariableValor,
} from '@models/motor.interfaces';

/**
 * Sintaxis de texto de condiciones y efectos, una alternativa al editor visual con las mismas reglas que el backend valida.
 *
 *   Condiciones               salud >= 50 y no en patio        tengo llave        tiene_pareja        (a o b) y c
 *                             objeto moneda >= 3      logro valiente      final bueno      tiempo == "noche"
 *   Efectos (uno por línea    salud -= 10       afecto += 5       tiene_pareja = verdadero       tiempo = "noche"
 *   o separados por ;)        alternar tiene_pareja      avanzar tiempo      dar llave      quitar 2 moneda
 *                             ir patio      logro valiente
 *
 * `no` liga más que `y`, y `y` más que `o`. También se aceptan `&&`, `||` y `!`. Es un parser propio de una gramática cerrada:
 * nunca se evalúa texto como código, solo se construye el mismo AST JSON que produce el editor visual.
 */
export interface IErrorSintaxis {
  mensaje: string;
  /** Posición (índice) del texto donde empieza el problema. */
  posicion: number;
  longitud: number;
}

export interface IResultadoCondicion {
  /** `null` si el texto está vacío (sin condición) o tiene errores. */
  condicion: ICondicion | null;
  errores: IErrorSintaxis[];
}

export interface IResultadoEfectos {
  efectos: IEfecto[];
  errores: IErrorSintaxis[];
}

type TipoToken = 'num' | 'str' | 'id' | 'op' | 'sep' | 'fin';

interface IToken {
  tipo: TipoToken;
  valor: string;
  num?: number;
  pos: number;
  len: number;
}

class ErrorSintaxis extends Error {
  constructor(
    mensaje: string,
    readonly posicion: number,
    readonly longitud: number
  ) {
    super(mensaje);
  }
}

const OPERADORES_DOBLES = ['==', '!=', '>=', '<=', '+=', '-=', '*=', '&&', '||'];
const OPERADORES_SIMPLES = ['>', '<', '=', '(', ')', ';', '!'];
const COMPARACIONES = ['==', '!=', '>', '>=', '<', '<='];
const CIERRE: Record<string, string> = { '"': '"', "'": "'", '“': '”' };

function esInicioId(c: string): boolean {
  return /[A-Za-z_áéíóúüñÁÉÍÓÚÜÑ]/.test(c);
}

function esParteId(c: string): boolean {
  return /[A-Za-z0-9_áéíóúüñÁÉÍÓÚÜÑ]/.test(c);
}

function tokenizar(texto: string, saltosSonSeparadores: boolean): IToken[] {
  const tokens: IToken[] = [];
  let i = 0;

  while (i < texto.length) {
    const c = texto[i];

    if (c === '\n' || c === '\r') {
      if (saltosSonSeparadores) tokens.push({ tipo: 'sep', valor: '\n', pos: i, len: 1 });
      i++;
      continue;
    }

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    const anterior = tokens[tokens.length - 1];
    const doble = texto.slice(i, i + 2);

    if (OPERADORES_DOBLES.includes(doble)) {
      tokens.push({ tipo: 'op', valor: doble, pos: i, len: 2 });
      i += 2;
    } else if (c === ';') {
      tokens.push({ tipo: 'sep', valor: ';', pos: i, len: 1 });
      i++;
    } else if (OPERADORES_SIMPLES.includes(c)) {
      tokens.push({ tipo: 'op', valor: c, pos: i, len: 1 });
      i++;
    } else if (/\d/.test(c) || (c === '-' && /\d/.test(texto[i + 1] ?? '') && (!anterior || anterior.tipo === 'op' || anterior.tipo === 'sep'))) {
      const inicio = i;
      i++;
      while (i < texto.length && /[\d.]/.test(texto[i])) i++;
      const cruda = texto.slice(inicio, i);
      const num = Number(cruda);
      if (!Number.isFinite(num)) {
        throw new ErrorSintaxis(`'${cruda}' no es un número válido`, inicio, cruda.length);
      }
      tokens.push({ tipo: 'num', valor: cruda, num, pos: inicio, len: cruda.length });
    } else if (c in CIERRE) {
      const inicio = i;
      const cierre = CIERRE[c];
      i++;
      let contenido = '';
      while (i < texto.length && texto[i] !== cierre) {
        contenido += texto[i];
        i++;
      }
      if (i >= texto.length) {
        throw new ErrorSintaxis('Falta cerrar las comillas', inicio, texto.length - inicio);
      }
      i++;
      tokens.push({ tipo: 'str', valor: contenido, pos: inicio, len: i - inicio });
    } else if (esInicioId(c)) {
      const inicio = i;
      while (i < texto.length && esParteId(texto[i])) i++;
      tokens.push({ tipo: 'id', valor: texto.slice(inicio, i), pos: inicio, len: i - inicio });
    } else {
      throw new ErrorSintaxis(`No entiendo el carácter «${c}»`, i, 1);
    }
  }

  tokens.push({ tipo: 'fin', valor: '', pos: texto.length, len: 0 });
  return tokens;
}

/** Distancia de edición entre dos palabras (para sugerir «¿quisiste decir…?»). */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temporal = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = temporal;
    }
  }
  return fila[b.length];
}

function sugerencia(nombre: string, candidatos: string[]): string {
  const objetivo = nombre.toLowerCase();
  const mejor = candidatos
    .map(c => ({ c, d: distancia(objetivo, c.toLowerCase()) }))
    .filter(x => x.d <= Math.max(1, Math.floor(objetivo.length / 3)))
    .sort((a, b) => a.d - b.d)[0];
  return mejor ? ` ¿Quisiste decir «${mejor.c}»?` : '';
}

function palabra(t: IToken): string {
  return t.tipo === 'id' ? t.valor.toLowerCase() : '';
}

class Analizador {
  private i = 0;

  constructor(
    private readonly tokens: IToken[],
    private readonly defs: IDefiniciones
  ) {}

  // ---- Acceso a tokens

  get actual(): IToken {
    return this.tokens[this.i];
  }

  private siguiente(): IToken {
    const t = this.tokens[this.i];
    if (t.tipo !== 'fin') this.i++;
    return t;
  }

  private mirar(desplazamiento = 1): IToken {
    return this.tokens[Math.min(this.i + desplazamiento, this.tokens.length - 1)];
  }

  private esOp(valor: string, t: IToken = this.actual): boolean {
    return t.tipo === 'op' && t.valor === valor;
  }

  private error(mensaje: string, t: IToken = this.actual): ErrorSintaxis {
    return new ErrorSintaxis(mensaje, t.pos, Math.max(1, t.len));
  }

  private describir(t: IToken): string {
    return t.tipo === 'fin' ? 'el final del texto' : t.tipo === 'sep' ? 'el separador' : `«${t.tipo === 'str' ? `"${t.valor}"` : t.valor}»`;
  }

  // ---- Referencias a lo definido

  private variable(t: IToken): IVariableDef {
    const def = this.defs.variables.find(v => v.clave === t.valor);
    if (!def) {
      throw this.error(`La variable «${t.valor}» no está definida.${sugerencia(t.valor, this.defs.variables.map(v => v.clave))}`, t);
    }
    return def;
  }

  private id(t: IToken, esperado: string): void {
    if (t.tipo !== 'id') {
      throw this.error(`Se esperaba ${esperado}, pero hay ${this.describir(t)}.`, t);
    }
  }

  private objeto(t: IToken): string {
    this.id(t, 'el id de un objeto');
    const claves = (this.defs.objetos ?? []).map(o => o.id);
    if (!claves.includes(t.valor)) {
      throw this.error(`El objeto «${t.valor}» no está definido.${sugerencia(t.valor, claves)}`, t);
    }
    return t.valor;
  }

  private ubicacion(t: IToken): string {
    this.id(t, 'el id de una ubicación');
    const claves = (this.defs.ubicaciones ?? []).map(u => u.id);
    if (!claves.includes(t.valor)) {
      throw this.error(`La ubicación «${t.valor}» no está definida.${sugerencia(t.valor, claves)}`, t);
    }
    return t.valor;
  }

  private meta(t: IToken, catalogo: 'logros' | 'finales'): string {
    const nombre = catalogo === 'logros' ? 'logro' : 'final';
    this.id(t, `el id de un ${nombre}`);
    const claves = (this.defs[catalogo] ?? []).map(m => m.id);
    if (!claves.includes(t.valor)) {
      throw this.error(`El ${nombre} «${t.valor}» no está definido.${sugerencia(t.valor, claves)}`, t);
    }
    return t.valor;
  }

  // ---- Valores

  private valor(def: IVariableDef, t: IToken): VariableValor {
    let valor: VariableValor;

    if (t.tipo === 'num') {
      valor = t.num!;
    } else if (t.tipo === 'str') {
      valor = t.valor;
    } else if (t.tipo === 'id' && ['verdadero', 'true'].includes(palabra(t))) {
      valor = true;
    } else if (t.tipo === 'id' && ['falso', 'false'].includes(palabra(t))) {
      valor = false;
    } else if (t.tipo === 'id' && def.tipo === 'texto' && def.valores?.includes(t.valor)) {
      valor = t.valor; // un valor de la lista se puede escribir sin comillas: tiempo == tarde
    } else {
      throw this.error(`Se esperaba un valor para «${def.clave}», pero hay ${this.describir(t)}.`, t);
    }

    this.comprobarTipo(def, valor, t);
    return valor;
  }

  private comprobarTipo(def: IVariableDef, valor: VariableValor, t: IToken): void {
    if (def.tipo === 'numero' && typeof valor !== 'number') {
      throw this.error(`«${def.clave}» es un número: escribe un número (por ejemplo 50).`, t);
    }
    if (def.tipo === 'booleano' && typeof valor !== 'boolean') {
      throw this.error(`«${def.clave}» es de sí/no: escribe verdadero o falso.`, t);
    }
    if (def.tipo === 'texto') {
      if (typeof valor !== 'string') {
        throw this.error(`«${def.clave}» es de texto: escribe el valor entre comillas (por ejemplo "tarde").`, t);
      }
      if (def.valores?.length && !def.valores.includes(valor)) {
        throw this.error(`«${valor}» no es un valor permitido de «${def.clave}» (${def.valores.join(', ')}).`, t);
      }
    }
  }

  // ---- Condiciones

  condicion(): ICondicion {
    const c = this.o();
    if (this.actual.tipo !== 'fin') {
      throw this.error(`No entiendo ${this.describir(this.actual)} aquí; se esperaba «y», «o» o el final de la condición.`);
    }
    return c;
  }

  private o(): ICondicion {
    const items = [this.y()];
    while (palabra(this.actual) === 'o' || this.esOp('||')) {
      this.siguiente();
      items.push(this.y());
    }
    return items.length > 1 ? { o: items } : items[0];
  }

  private y(): ICondicion {
    const items = [this.no()];
    while (palabra(this.actual) === 'y' || this.esOp('&&')) {
      this.siguiente();
      items.push(this.no());
    }
    return items.length > 1 ? { y: items } : items[0];
  }

  private no(): ICondicion {
    if (palabra(this.actual) === 'no' || this.esOp('!')) {
      this.siguiente();
      return { no: this.no() };
    }
    return this.primaria();
  }

  private primaria(): ICondicion {
    const t = this.actual;

    if (this.esOp('(')) {
      this.siguiente();
      const c = this.o();
      if (!this.esOp(')')) {
        throw this.error('Falta cerrar el paréntesis.');
      }
      this.siguiente();
      return c;
    }

    if (t.tipo !== 'id') {
      throw this.error(
        t.tipo === 'fin' ? 'Falta una condición.' : `Se esperaba una condición, pero hay ${this.describir(t)}.`
      );
    }

    switch (palabra(t)) {
      case 'en':
        this.siguiente();
        return { en: this.ubicacion(this.siguiente()) };
      case 'logro':
        this.siguiente();
        return { logro: this.meta(this.siguiente(), 'logros') };
      case 'final':
        this.siguiente();
        return { final: this.meta(this.siguiente(), 'finales') };
      case 'tengo': {
        this.siguiente();
        const cantidad = this.actual.tipo === 'num' ? this.siguiente() : undefined;
        if (cantidad && (!Number.isInteger(cantidad.num) || cantidad.num! < 1)) {
          throw this.error('La cantidad debe ser un entero desde 1.', cantidad);
        }
        return { objeto: this.objeto(this.siguiente()), op: '>=', valor: cantidad?.num ?? 1 };
      }
      case 'objeto': {
        this.siguiente();
        const id = this.objeto(this.siguiente());
        const op = this.operador();
        const n = this.siguiente();
        if (n.tipo !== 'num' || !Number.isInteger(n.num) || n.num! < 0) {
          throw this.error(`La cantidad de «${id}» se compara con un número entero desde 0.`, n);
        }
        return { objeto: id, op, valor: n.num! };
      }
      case 'y':
      case 'o':
        throw this.error(`Se esperaba una condición antes de «${t.valor}».`, t);
      default:
        return this.comparacion();
    }
  }

  private operador(): OpComparacion {
    const t = this.actual;
    if (t.tipo === 'op' && (COMPARACIONES.includes(t.valor) || t.valor === '=')) {
      this.siguiente();
      return (t.valor === '=' ? '==' : t.valor) as OpComparacion;
    }
    throw this.error(`Se esperaba un operador de comparación (==, !=, >, >=, <, <=), pero hay ${this.describir(t)}.`, t);
  }

  private comparacion(): ICondicion {
    const nombre = this.siguiente();
    const def = this.variable(nombre);
    const t = this.actual;

    // Una variable de sí/no sola es la forma corta de `== verdadero`.
    if (!(t.tipo === 'op' && (COMPARACIONES.includes(t.valor) || t.valor === '='))) {
      if (def.tipo !== 'booleano') {
        throw this.error(`«${def.clave}» necesita una comparación (por ejemplo ${def.clave} ${def.tipo === 'numero' ? '>= 50' : '== "valor"'}).`, nombre);
      }
      return { var: def.clave, op: '==', valor: true };
    }

    const op = this.operador();
    if (def.tipo !== 'numero' && op !== '==' && op !== '!=') {
      throw this.error(`«${def.clave}» solo se puede comparar con == o !=.`, t);
    }
    return { var: def.clave, op, valor: this.valor(def, this.siguiente()) };
  }

  // ---- Efectos

  efectos(): { efectos: IEfecto[]; errores: IErrorSintaxis[] } {
    const efectos: IEfecto[] = [];
    const errores: IErrorSintaxis[] = [];
    // Se lee cada vez del token actual: los métodos que consumen tokens lo cambian y TypeScript no lo sabe.
    const tipo = (): TipoToken => this.actual.tipo;

    while (tipo() !== 'fin') {
      if (tipo() === 'sep') {
        this.siguiente();
        continue;
      }

      try {
        efectos.push(this.efecto());
        if (tipo() !== 'sep' && tipo() !== 'fin') {
          throw this.error(`No entiendo ${this.describir(this.actual)} aquí; separa los efectos con «;» o con un salto de línea.`);
        }
      } catch (e) {
        if (!(e instanceof ErrorSintaxis)) throw e;
        errores.push({ mensaje: e.message, posicion: e.posicion, longitud: e.longitud });
        // Se sigue en el siguiente efecto para poder mostrar todos los problemas de una vez.
        while (tipo() !== 'sep' && tipo() !== 'fin') this.siguiente();
      }
    }

    return { efectos, errores };
  }

  private cantidad(): number | undefined {
    if (this.actual.tipo !== 'num') return undefined;
    const t = this.siguiente();
    if (!Number.isInteger(t.num) || t.num! < 1) {
      throw this.error('La cantidad debe ser un entero desde 1.', t);
    }
    return t.num;
  }

  private efecto(): IEfecto {
    const t = this.siguiente();
    this.id(t, 'un efecto (por ejemplo «salud -= 10» o «dar llave»)');

    switch (palabra(t)) {
      case 'alternar': {
        const def = this.variable(this.siguiente());
        if (def.tipo !== 'booleano') throw this.error(`«alternar» solo aplica a variables de sí/no, y «${def.clave}» no lo es.`, this.tokens[this.i - 1]);
        return { var: def.clave, op: 'alternar' };
      }
      case 'avanzar': {
        const def = this.variable(this.siguiente());
        if (def.tipo !== 'texto' || (def.valores?.length ?? 0) < 2) {
          throw this.error(`«avanzar» solo aplica a variables de texto con al menos dos valores permitidos, y «${def.clave}» no las tiene.`, this.tokens[this.i - 1]);
        }
        return { var: def.clave, op: 'avanzar' };
      }
      case 'dar':
      case 'quitar': {
        const cantidad = this.cantidad();
        const objeto = this.objeto(this.siguiente());
        return { objeto, op: palabra(t) as 'dar' | 'quitar', ...(cantidad && cantidad !== 1 ? { cantidad } : {}) };
      }
      case 'ir': {
        // «ir a patio» e «ir patio»: la «a» solo se salta si viene otra palabra detrás (una ubicación puede llamarse «a»).
        if (palabra(this.actual) === 'a' && this.mirar().tipo === 'id') this.siguiente();
        return { ir: this.ubicacion(this.siguiente()) };
      }
      case 'logro':
        return { logro: this.meta(this.siguiente(), 'logros') };
      default:
        return this.asignacion(t);
    }
  }

  private asignacion(nombre: IToken): IEfecto {
    const def = this.variable(nombre);
    const t = this.siguiente();

    if (t.tipo !== 'op' || !['=', '+=', '-=', '*='].includes(t.valor)) {
      throw this.error(`Después de «${def.clave}» se esperaba «=», «+=», «-=» o «*=», pero hay ${this.describir(t)}.`, t);
    }

    if (t.valor !== '=' && def.tipo !== 'numero') {
      throw this.error(`«${t.valor}» solo aplica a números, y «${def.clave}» no lo es.`, t);
    }

    const op = { '=': 'fijar', '+=': 'sumar', '-=': 'restar', '*=': 'multiplicar' }[t.valor] as 'fijar' | 'sumar' | 'restar' | 'multiplicar';
    return { var: def.clave, op, valor: this.valor(def, this.siguiente()) };
  }
}

const SIN_DEFINICIONES: IDefiniciones = { variables: [] };

function comoError(e: unknown): IErrorSintaxis {
  if (e instanceof ErrorSintaxis) {
    return { mensaje: e.message, posicion: e.posicion, longitud: e.longitud };
  }
  throw e;
}

/** Lee una condición escrita como texto. Un texto vacío es «sin condición» (`null`). */
export function parsearCondicion(texto: string, defs?: IDefiniciones | null): IResultadoCondicion {
  if (!texto.trim()) {
    return { condicion: null, errores: [] };
  }

  try {
    const analizador = new Analizador(tokenizar(texto, false), defs ?? SIN_DEFINICIONES);
    return { condicion: analizador.condicion(), errores: [] };
  } catch (e) {
    return { condicion: null, errores: [comoError(e)] };
  }
}

/** Lee una lista de efectos escrita como texto (uno por línea o separados por `;`). Un texto vacío es una lista vacía. */
export function parsearEfectos(texto: string, defs?: IDefiniciones | null): IResultadoEfectos {
  if (!texto.trim()) {
    return { efectos: [], errores: [] };
  }

  try {
    const resultado = new Analizador(tokenizar(texto, true), defs ?? SIN_DEFINICIONES).efectos();
    // Si hay errores no se devuelven efectos a medias: quien edita no debe guardar algo que no escribió.
    return resultado.errores.length ? { efectos: [], errores: resultado.errores } : resultado;
  } catch (e) {
    return { efectos: [], errores: [comoError(e)] };
  }
}
