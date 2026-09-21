import { ICondicion, IEfecto } from '@models/motor.interfaces';
import { DEFS } from './engine-fixtures';
import { parsearCondicion, parsearEfectos } from './sintaxis';
import { describirCondicion, escribirEfectos } from './texto';

describe('sintaxis de texto: condiciones', () => {
  const cond = (texto: string) => parsearCondicion(texto, DEFS);
  const ok = (texto: string): ICondicion | null => {
    const r = cond(texto);
    expect(r.errores).withContext(texto).toEqual([]);
    return r.condicion;
  };
  const mensajeDe = (texto: string) => cond(texto).errores[0]?.mensaje ?? '';

  it('un texto vacío es «sin condición»', () => {
    expect(cond('')).toEqual({ condicion: null, errores: [] });
    expect(cond('   \n ')).toEqual({ condicion: null, errores: [] });
  });

  it('lee comparaciones con todos los operadores', () => {
    expect(ok('salud >= 50')).toEqual({ var: 'salud', op: '>=', valor: 50 });
    expect(ok('salud > 50')).toEqual({ var: 'salud', op: '>', valor: 50 });
    expect(ok('salud <= 50')).toEqual({ var: 'salud', op: '<=', valor: 50 });
    expect(ok('salud < 50')).toEqual({ var: 'salud', op: '<', valor: 50 });
    expect(ok('salud == 50')).toEqual({ var: 'salud', op: '==', valor: 50 });
    expect(ok('salud != 50')).toEqual({ var: 'salud', op: '!=', valor: 50 });
  });

  it('acepta «=» como igualdad y números negativos y decimales', () => {
    expect(ok('salud = 10')).toEqual({ var: 'salud', op: '==', valor: 10 });
    expect(ok('afecto > -5')).toEqual({ var: 'afecto', op: '>', valor: -5 });
    expect(ok('afecto <= 2.5')).toEqual({ var: 'afecto', op: '<=', valor: 2.5 });
  });

  it('lee textos entre comillas simples, dobles o tipográficas, y valores de la lista sin comillas', () => {
    expect(ok('tiempo == "tarde"')).toEqual({ var: 'tiempo', op: '==', valor: 'tarde' });
    expect(ok("tiempo == 'tarde'")).toEqual({ var: 'tiempo', op: '==', valor: 'tarde' });
    expect(ok('tiempo == “noche”')).toEqual({ var: 'tiempo', op: '==', valor: 'noche' });
    expect(ok('tiempo == tarde')).toEqual({ var: 'tiempo', op: '==', valor: 'tarde' });
    expect(ok('nombre == "Ana"')).toEqual({ var: 'nombre', op: '==', valor: 'Ana' });
  });

  it('una variable de sí/no sola es «== verdadero»; también se acepta verdadero/falso/true/false', () => {
    expect(ok('tiene_pareja')).toEqual({ var: 'tiene_pareja', op: '==', valor: true });
    expect(ok('tiene_pareja == falso')).toEqual({ var: 'tiene_pareja', op: '==', valor: false });
    expect(ok('tiene_pareja != verdadero')).toEqual({ var: 'tiene_pareja', op: '!=', valor: true });
    expect(ok('tiene_pareja == false')).toEqual({ var: 'tiene_pareja', op: '==', valor: false });
    expect(ok('tiene_pareja == TRUE')).toEqual({ var: 'tiene_pareja', op: '==', valor: true });
  });

  it('lee reglas de objetos, ubicación, logros y finales', () => {
    expect(ok('tengo llave')).toEqual({ objeto: 'llave', op: '>=', valor: 1 });
    expect(ok('tengo 3 moneda')).toEqual({ objeto: 'moneda', op: '>=', valor: 3 });
    expect(ok('objeto moneda < 10')).toEqual({ objeto: 'moneda', op: '<', valor: 10 });
    expect(ok('objeto llave == 0')).toEqual({ objeto: 'llave', op: '==', valor: 0 });
    expect(ok('en patio')).toEqual({ en: 'patio' });
    expect(ok('logro valiente')).toEqual({ logro: 'valiente' });
    expect(ok('final bueno')).toEqual({ final: 'bueno' });
  });

  it('las palabras clave no distinguen mayúsculas', () => {
    expect(ok('EN patio Y NO Tengo llave')).toEqual({ y: [{ en: 'patio' }, { no: { objeto: 'llave', op: '>=', valor: 1 } }] });
  });

  it('«no» liga más que «y» y «y» más que «o»', () => {
    expect(ok('tiene_pareja o salud > 1 y en patio')).toEqual({
      o: [{ var: 'tiene_pareja', op: '==', valor: true }, { y: [{ var: 'salud', op: '>', valor: 1 }, { en: 'patio' }] }],
    });
    expect(ok('no tiene_pareja y en patio')).toEqual({
      y: [{ no: { var: 'tiene_pareja', op: '==', valor: true } }, { en: 'patio' }],
    });
  });

  it('los paréntesis cambian la precedencia', () => {
    expect(ok('(tiene_pareja o en patio) y salud > 1')).toEqual({
      y: [{ o: [{ var: 'tiene_pareja', op: '==', valor: true }, { en: 'patio' }] }, { var: 'salud', op: '>', valor: 1 }],
    });
    expect(ok('no (en patio y tengo llave)')).toEqual({
      no: { y: [{ en: 'patio' }, { objeto: 'llave', op: '>=', valor: 1 }] },
    });
  });

  it('una cadena de «y» se aplana en un solo grupo, pero un grupo entre paréntesis se conserva', () => {
    expect(ok('en patio y tengo llave y salud > 1')).toEqual({
      y: [{ en: 'patio' }, { objeto: 'llave', op: '>=', valor: 1 }, { var: 'salud', op: '>', valor: 1 }],
    });
    expect(ok('(en patio y tengo llave) y salud > 1')).toEqual({
      y: [{ y: [{ en: 'patio' }, { objeto: 'llave', op: '>=', valor: 1 }] }, { var: 'salud', op: '>', valor: 1 }],
    });
  });

  it('acepta los símbolos && || !', () => {
    expect(ok('!en patio && (salud > 1 || tiene_pareja)')).toEqual({
      y: [{ no: { en: 'patio' } }, { o: [{ var: 'salud', op: '>', valor: 1 }, { var: 'tiene_pareja', op: '==', valor: true }] }],
    });
  });

  it('ignora espacios y saltos de línea entre partes', () => {
    expect(ok('  salud   >=\n 50  ')).toEqual({ var: 'salud', op: '>=', valor: 50 });
  });

  describe('errores', () => {
    it('una variable que no existe, con sugerencia si se parece a otra', () => {
      expect(mensajeDe('sald > 5')).toContain('«sald» no está definida');
      expect(mensajeDe('sald > 5')).toContain('¿Quisiste decir «salud»?');
      expect(mensajeDe('zzzz > 5')).not.toContain('Quisiste');
    });

    it('la mayúscula cuenta: «Salud» no es «salud», y se sugiere', () => {
      expect(mensajeDe('Salud > 5')).toContain('¿Quisiste decir «salud»?');
    });

    it('un objeto, ubicación, logro o final que no existen', () => {
      expect(mensajeDe('tengo llabe')).toContain('El objeto «llabe» no está definido');
      expect(mensajeDe('tengo llabe')).toContain('«llave»');
      expect(mensajeDe('en patioo')).toContain('La ubicación «patioo»');
      expect(mensajeDe('logro fantasma')).toContain('El logro «fantasma»');
      expect(mensajeDe('final fantasma')).toContain('El final «fantasma»');
    });

    it('el tipo del valor debe ser el de la variable', () => {
      expect(mensajeDe('salud > "alto"')).toContain('es un número');
      expect(mensajeDe('tiene_pareja == 1')).toContain('verdadero o falso');
      expect(mensajeDe('nombre == 5')).toContain('es de texto');
      expect(mensajeDe('tiempo == "madrugada"')).toContain('no es un valor permitido');
    });

    it('un texto o un sí/no solo se comparan con == o !=', () => {
      expect(mensajeDe('tiempo > "tarde"')).toContain('solo se puede comparar con == o !=');
      expect(mensajeDe('tiene_pareja >= verdadero')).toContain('solo se puede comparar');
    });

    it('un número o un texto solos necesitan una comparación', () => {
      expect(mensajeDe('salud')).toContain('necesita una comparación');
      expect(mensajeDe('tiempo')).toContain('necesita una comparación');
    });

    it('la cantidad de un objeto es un entero', () => {
      expect(mensajeDe('objeto llave >= 1.5')).toContain('número entero');
      expect(mensajeDe('objeto llave >= -1')).toContain('número entero');
      expect(mensajeDe('tengo 0 llave')).toContain('entero desde 1');
    });

    it('paréntesis sin cerrar, texto sobrante, cosas que faltan y caracteres raros', () => {
      expect(mensajeDe('(salud > 5')).toContain('Falta cerrar el paréntesis');
      expect(mensajeDe('salud > 5 )')).toContain('No entiendo');
      expect(mensajeDe('salud > 5 en patio')).toContain('No entiendo');
      expect(mensajeDe('salud >')).toContain('Se esperaba un valor');
      expect(mensajeDe('en patio y')).toContain('Falta una condición');
      expect(mensajeDe('y en patio')).toContain('Se esperaba una condición');
      expect(mensajeDe('salud > 5 @')).toContain('No entiendo el carácter «@»');
      expect(mensajeDe('nombre == "Ana')).toContain('comillas');
    });

    it('el error dice dónde está', () => {
      const e = cond('salud > 5 y sald < 3').errores[0];

      expect(e.posicion).toBe(12);
      expect(e.longitud).toBe(4);
    });

    it('con errores no se devuelve una condición a medias', () => {
      expect(cond('salud > 5 y sald < 3').condicion).toBeNull();
    });

    it('sin definiciones toda referencia es desconocida', () => {
      expect(parsearCondicion('salud > 5', null).errores.length).toBe(1);
      expect(parsearCondicion('salud > 5', undefined).errores.length).toBe(1);
    });
  });
});

describe('sintaxis de texto: efectos', () => {
  const efectos = (texto: string) => parsearEfectos(texto, DEFS);
  const ok = (texto: string): IEfecto[] => {
    const r = efectos(texto);
    expect(r.errores).withContext(texto).toEqual([]);
    return r.efectos;
  };

  it('un texto vacío es una lista vacía', () => {
    expect(efectos('')).toEqual({ efectos: [], errores: [] });
    expect(efectos(' ;\n; ')).toEqual({ efectos: [], errores: [] });
  });

  it('lee asignaciones y operaciones aritméticas', () => {
    expect(ok('salud -= 10')).toEqual([{ var: 'salud', op: 'restar', valor: 10 }]);
    expect(ok('salud += 5')).toEqual([{ var: 'salud', op: 'sumar', valor: 5 }]);
    expect(ok('afecto *= 2')).toEqual([{ var: 'afecto', op: 'multiplicar', valor: 2 }]);
    expect(ok('salud = 50')).toEqual([{ var: 'salud', op: 'fijar', valor: 50 }]);
    expect(ok('tiene_pareja = verdadero')).toEqual([{ var: 'tiene_pareja', op: 'fijar', valor: true }]);
    expect(ok('tiempo = "noche"')).toEqual([{ var: 'tiempo', op: 'fijar', valor: 'noche' }]);
    expect(ok('tiempo = noche')).toEqual([{ var: 'tiempo', op: 'fijar', valor: 'noche' }]);
    expect(ok('nombre = "Ana"')).toEqual([{ var: 'nombre', op: 'fijar', valor: 'Ana' }]);
    expect(ok('afecto -= -3')).toEqual([{ var: 'afecto', op: 'restar', valor: -3 }]);
  });

  it('lee alternar y avanzar', () => {
    expect(ok('alternar tiene_pareja')).toEqual([{ var: 'tiene_pareja', op: 'alternar' }]);
    expect(ok('avanzar tiempo')).toEqual([{ var: 'tiempo', op: 'avanzar' }]);
  });

  it('lee dar, quitar (con y sin cantidad), ir y logro', () => {
    expect(ok('dar llave')).toEqual([{ objeto: 'llave', op: 'dar' }]);
    expect(ok('dar 5 moneda')).toEqual([{ objeto: 'moneda', op: 'dar', cantidad: 5 }]);
    expect(ok('quitar 2 moneda')).toEqual([{ objeto: 'moneda', op: 'quitar', cantidad: 2 }]);
    expect(ok('dar 1 llave')).toEqual([{ objeto: 'llave', op: 'dar' }]);
    expect(ok('ir patio')).toEqual([{ ir: 'patio' }]);
    expect(ok('ir a patio')).toEqual([{ ir: 'patio' }]);
    expect(ok('logro valiente')).toEqual([{ logro: 'valiente' }]);
  });

  it('«ir a» solo salta la «a» si viene otra palabra: una ubicación puede llamarse «a»', () => {
    const defs = { ...DEFS, ubicaciones: [{ id: 'a', nombre: 'A' }, { id: 'patio', nombre: 'Patio' }] };

    expect(parsearEfectos('ir a', defs).efectos).toEqual([{ ir: 'a' }]);
    expect(parsearEfectos('ir a a', defs).efectos).toEqual([{ ir: 'a' }]);
    expect(parsearEfectos('ir a patio', defs).efectos).toEqual([{ ir: 'patio' }]);
  });

  it('separa los efectos con «;» o con saltos de línea, en orden', () => {
    const esperado = [
      { var: 'salud', op: 'restar', valor: 10 },
      { objeto: 'llave', op: 'dar' },
      { ir: 'patio' },
    ];

    expect(ok('salud -= 10; dar llave; ir patio')).toEqual(esperado as IEfecto[]);
    expect(ok('salud -= 10\ndar llave\nir patio')).toEqual(esperado as IEfecto[]);
    expect(ok('salud -= 10;\n\n dar llave ;; ir patio;')).toEqual(esperado as IEfecto[]);
  });

  it('las palabras clave no distinguen mayúsculas', () => {
    expect(ok('DAR llave; Ir patio')).toEqual([{ objeto: 'llave', op: 'dar' }, { ir: 'patio' }]);
  });

  describe('errores', () => {
    const errores = (texto: string) => efectos(texto).errores.map(e => e.mensaje);

    it('referencias desconocidas, con sugerencia', () => {
      expect(errores('sald -= 1')[0]).toContain('¿Quisiste decir «salud»?');
      expect(errores('dar llabe')[0]).toContain('El objeto «llabe»');
      expect(errores('ir patioo')[0]).toContain('La ubicación');
      expect(errores('logro fantasma')[0]).toContain('El logro');
    });

    it('la operación debe ir con el tipo de variable', () => {
      expect(errores('tiene_pareja += 1')[0]).toContain('solo aplica a números');
      expect(errores('tiempo -= 1')[0]).toContain('solo aplica a números');
      expect(errores('alternar salud')[0]).toContain('solo aplica a variables de sí/no');
      expect(errores('avanzar salud')[0]).toContain('al menos dos valores');
      expect(errores('avanzar nombre')[0]).toContain('al menos dos valores');
      expect(errores('salud = "alto"')[0]).toContain('es un número');
      expect(errores('tiempo = "madrugada"')[0]).toContain('no es un valor permitido');
    });

    it('cantidades inválidas', () => {
      expect(errores('dar 0 llave')[0]).toContain('entero desde 1');
      expect(errores('dar 1.5 llave')[0]).toContain('entero desde 1');
    });

    it('una asignación sin operador, o dos efectos sin separador', () => {
      expect(errores('salud 10')[0]).toContain('se esperaba «=»');
      expect(errores('salud -= 1 dar llave')[0]).toContain('separa los efectos');
      expect(errores('5 += 1')[0]).toContain('Se esperaba un efecto');
    });

    it('junta los errores de todos los efectos, cada uno con su posición', () => {
      const r = efectos('sald -= 1\ndar llave\nir patioo');

      expect(r.errores.length).toBe(2);
      expect(r.errores[0].posicion).toBe(0);
      expect(r.errores[1].posicion).toBe(23);   // donde empieza «patioo»
    });

    it('con errores no se devuelven efectos a medias', () => {
      expect(efectos('dar llave; sald -= 1').efectos).toEqual([]);
    });

    it('un carácter raro o unas comillas sin cerrar', () => {
      expect(errores('salud -= 1 @')[0]).toContain('No entiendo el carácter');
      expect(errores('nombre = "Ana')[0]).toContain('comillas');
    });
  });
});

describe('sintaxis de texto: ida y vuelta', () => {
  // Generador determinista de condiciones válidas para DEFS (sin grupos de un solo elemento: se escribirían sin grupo).
  function generador(semilla: number) {
    let s = semilla;
    const azar = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const elegir = <T>(xs: T[]): T => xs[Math.floor(azar() * xs.length)];
    const ops = ['==', '!=', '>', '>=', '<', '<='] as const;

    const hoja = (): ICondicion =>
      elegir<() => ICondicion>([
        () => ({ var: 'salud', op: elegir([...ops]), valor: Math.round(azar() * 200 - 50) }),
        () => ({ var: 'afecto', op: elegir([...ops]), valor: Math.round(azar() * 40) / 4 }),
        () => ({ var: 'tiene_pareja', op: elegir(['==', '!='] as const), valor: azar() < 0.5 }),
        () => ({ var: 'tiempo', op: elegir(['==', '!='] as const), valor: elegir(['mañana', 'tarde', 'noche']) }),
        () => ({ var: 'nombre', op: '==', valor: elegir(['Ana', 'a b', 'x']) }),
        () => ({ objeto: elegir(['llave', 'moneda', 'pocion']), op: elegir([...ops]), valor: Math.floor(azar() * 5) }),
        () => ({ en: elegir(['biblioteca', 'patio']) }),
        () => ({ logro: elegir(['valiente', 'curioso']) }),
        () => ({ final: elegir(['bueno', 'malo']) }),
      ])();

    const rama = (prof: number): ICondicion => {
      if (prof === 0 || azar() < 0.35) return hoja();
      const tipo = azar();
      if (tipo < 0.25) return { no: rama(prof - 1) };
      const n = 2 + Math.floor(azar() * 2);
      const items = Array.from({ length: n }, () => rama(prof - 1));
      return tipo < 0.65 ? { y: items } : { o: items };
    };

    return () => rama(3);
  }

  it('escribir una condición y volver a leerla da la misma condición (300 casos)', () => {
    const nueva = generador(12345);

    for (let i = 0; i < 300; i++) {
      const original = nueva();
      const texto = describirCondicion(original);
      const r = parsearCondicion(texto, DEFS);

      expect(r.errores).withContext(texto).toEqual([]);
      expect(r.condicion).withContext(texto).toEqual(original);
    }
  });

  it('escribir efectos y volver a leerlos da los mismos efectos', () => {
    const originales: IEfecto[] = [
      { var: 'salud', op: 'restar', valor: 10 },
      { var: 'salud', op: 'sumar', valor: 2.5 },
      { var: 'afecto', op: 'multiplicar', valor: 3 },
      { var: 'salud', op: 'fijar', valor: -4 },
      { var: 'tiene_pareja', op: 'fijar', valor: false },
      { var: 'tiene_pareja', op: 'alternar' },
      { var: 'tiempo', op: 'fijar', valor: 'noche' },
      { var: 'tiempo', op: 'avanzar' },
      { var: 'nombre', op: 'fijar', valor: 'Ana María' },
      { objeto: 'llave', op: 'dar' },
      { objeto: 'moneda', op: 'quitar', cantidad: 7 },
      { ir: 'patio' },
      { logro: 'valiente' },
    ];

    const r = parsearEfectos(escribirEfectos(originales), DEFS);

    expect(r.errores).toEqual([]);
    expect(r.efectos).toEqual(originales);
  });
});
