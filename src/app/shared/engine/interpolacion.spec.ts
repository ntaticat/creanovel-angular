import { IEstadoJuego } from '@models/motor.interfaces';
import { DEFS } from './engine-fixtures';
import { crearEstadoInicial } from './estado';
import { formatearNumero, interpolar, parsearPlantilla, validarPlantilla } from './interpolacion';

describe('interpolación de textos', () => {
  const base = (): IEstadoJuego => ({
    ...crearEstadoInicial(DEFS),
    vars: { salud: 90, afecto: 2.456, tiene_pareja: true, tiempo: 'tarde', nombre: 'Ana' },
    inventario: { llave: 1, moneda: 12 },
    ubicacion: 'patio',
    logros: ['valiente'],
    finales: [],
  });
  const t = (texto: string, estado = base()) => interpolar(texto, estado, DEFS);

  describe('variables', () => {
    it('sustituye variables de texto, número y sí/no', () => {
      expect(t('Hola {nombre}, te quedan {salud} de salud.')).toBe('Hola Ana, te quedan 90 de salud.');
      expect(t('¿Pareja? {tiene_pareja}')).toBe('¿Pareja? sí');
      expect(t('¿Pareja? {tiene_pareja}', { ...base(), vars: { ...base().vars, tiene_pareja: false } })).toBe('¿Pareja? no');
      expect(t('Es de {tiempo}.')).toBe('Es de tarde.');
    });

    it('los decimales se redondean a dos cifras y los enteros no llevan coma', () => {
      expect(t('{afecto}')).toBe('2.46');
      expect(formatearNumero(3)).toBe('3');
      expect(formatearNumero(0.1 + 0.2)).toBe('0.3');
      expect(formatearNumero(-1.005)).toBe('-1');
    });

    it('acepta espacios dentro de las llaves', () => {
      expect(t('{ nombre }')).toBe('Ana');
    });

    it('una variable que no existe se deja tal cual', () => {
      expect(t('Hola {fantasma}.')).toBe('Hola {fantasma}.');
    });

    it('sin llaves el texto sale idéntico (y sin gastar trabajo)', () => {
      expect(t('Un texto normal.')).toBe('Un texto normal.');
      expect(t('')).toBe('');
    });
  });

  describe('objetos y ubicación', () => {
    it('{objeto:id} da la cantidad, con 0 si no se tiene', () => {
      expect(t('Tienes {objeto:moneda} monedas y {objeto:llave} llave.')).toBe('Tienes 12 monedas y 1 llave.');
      expect(t('Pociones: {objeto:pocion}')).toBe('Pociones: 0');
    });

    it('un objeto que no existe se deja tal cual', () => {
      expect(t('{objeto:espada}')).toBe('{objeto:espada}');
    });

    it('{ubicacion} da el nombre del lugar, o «ningún lugar»', () => {
      expect(t('Estás en {ubicacion}.')).toBe('Estás en Patio.');
      expect(t('Estás en {ubicacion}.', { ...base(), ubicacion: null })).toBe('Estás en ningún lugar.');
    });
  });

  describe('bloques condicionales', () => {
    it('elige entre dos textos según la condición', () => {
      expect(t('{si salud < 30: te duele todo | te sientes bien}')).toBe('te sientes bien');
      expect(t('Hoy te {si salud < 30: duele todo | sientes bien} de verdad.')).toBe('Hoy te sientes bien de verdad.');
      expect(t('{si salud >= 30:Bien|Mal}', { ...base(), vars: { ...base().vars, salud: 10 } })).toBe('Mal');
      expect(t('{si salud >= 30:Bien|Mal}')).toBe('Bien');
    });

    it('con «|» se recortan los espacios de cada rama; sin él se respeta lo escrito', () => {
      expect(t('a {si tiene_pareja:   uno   |   otro   } b')).toBe('a uno b');
      expect(t('Ana{si tiene_pareja: y su pareja}.')).toBe('Ana y su pareja.');
      expect(t('Ana{si tiene_pareja:, y su pareja}.')).toBe('Ana, y su pareja.');
      expect(t('x{si tiene_pareja: | solo}y')).toBe('xy');                                    // rama «entonces» vacía
      expect(t('x{si no tiene_pareja: | solo}y')).toBe('xsoloy');
    });

    it('el texto contrario es opcional', () => {
      expect(t('Ves a Ana{si tiene_pareja: y a su pareja}.')).toBe('Ves a Ana y a su pareja.');
      expect(t('Ves a Ana{si no tiene_pareja: y a su pareja}.')).toBe('Ves a Ana.');
    });

    it('usa toda la sintaxis de condiciones: objetos, ubicación, logros, y/o/no', () => {
      expect(t('{si tengo llave y en patio: abres | no abres}')).toBe('abres');
      expect(t('{si logro valiente o final bueno: héroe|novato}')).toBe('héroe');
      expect(t('{si no (en biblioteca): fuera|dentro}')).toBe('fuera');
      expect(t('{si tiempo == "tarde": tarde|otra hora}')).toBe('tarde');
    });

    it('los textos pueden llevar variables y otros bloques dentro', () => {
      expect(t('{si salud > 50: tienes {salud} de salud | poca salud ({salud})}')).toBe('tienes 90 de salud');
      expect(t('{si en patio: {si tengo llave: con llave|sin llave}|dentro}')).toBe('con llave');
    });

    it('un «|» dentro de comillas de la condición no separa', () => {
      expect(t('{si nombre == "a|b": raro|normal}', { ...base(), vars: { ...base().vars, nombre: 'a|b' } })).toBe('raro');
    });

    it('una condición con errores deja el bloque tal cual', () => {
      expect(t('{si fantasma > 1: a | b}')).toBe('{si fantasma > 1: a | b}');
    });
  });

  describe('llaves literales y bloques mal escritos', () => {
    it('{{ y }} son llaves literales', () => {
      expect(t('Escribe {{nombre}} tal cual y {nombre}.')).toBe('Escribe {nombre} tal cual y Ana.');
    });

    it('un bloque sin cerrar o que no se entiende queda como está', () => {
      expect(t('Hola {nombre')).toBe('Hola {nombre');
      expect(t('Algo {con espacios} raro')).toBe('Algo {con espacios} raro');
      expect(t('{}')).toBe('{}');
      expect(t('{Nombre}')).toBe('{Nombre}');
    });

    it('una llave de cierre suelta se muestra tal cual', () => {
      expect(t('fin }')).toBe('fin }');
    });

    it('un bloque condicional sin «:» o con dos «|» queda como está', () => {
      expect(t('{si salud > 1 hola}')).toBe('{si salud > 1 hola}');
      expect(t('{si salud > 1: a | b | c}')).toBe('{si salud > 1: a | b | c}');
    });

    it('nunca lanza, aunque el texto sea absurdo', () => {
      const raros = ['{', '}', '{{{', '}}}', '{si', '{si:', '{si :}', '{si a:{si b:{si c:', '{|}', '{{}}', '{objeto:}', '{objeto:x', '{ubicacion'];
      for (const texto of raros) {
        expect(() => t(texto)).withContext(texto).not.toThrow();
        expect(() => validarPlantilla(texto, DEFS)).withContext(texto).not.toThrow();
      }
    });
  });

  it('sin definiciones, las variables se dejan tal cual', () => {
    expect(interpolar('Hola {nombre}', base(), null)).toBe('Hola {nombre}');
    expect(interpolar('Hola {nombre}', base(), undefined)).toBe('Hola {nombre}');
  });

  it('parsearPlantilla reutiliza el resultado del mismo texto', () => {
    expect(parsearPlantilla('igual {salud}')).toBe(parsearPlantilla('igual {salud}'));
  });

  describe('validarPlantilla (avisos del editor)', () => {
    const errores = (texto: string) => validarPlantilla(texto, DEFS);

    it('un texto correcto o sin llaves no tiene problemas', () => {
      expect(errores('Hola {nombre}, {objeto:llave}, {ubicacion} y {si salud > 1: a | b}')).toEqual([]);
      expect(errores('sin llaves')).toEqual([]);
      expect(errores('Escapadas {{así}}')).toEqual([]);
    });

    it('avisa de variables y objetos desconocidos, con sugerencia', () => {
      const [e] = errores('Hola {nomre}');

      expect(e.mensaje).toContain('«nomre» no está definida');
      expect(errores('{salu}')[0].mensaje).toContain('¿Quisiste decir «salud»?');
      expect(errores('{objeto:llabe}')[0].mensaje).toContain('El objeto «llabe»');
    });

    it('dice dónde está el problema', () => {
      const [e] = errores('Hola {nomre}!');

      expect(e.posicion).toBe(5);
      expect(e.longitud).toBe(7);
    });

    it('avisa de los errores de la condición, con su posición dentro del texto', () => {
      const [e] = errores('Ves {si sald > 1: a | b} algo');

      expect(e.mensaje).toContain('En la condición');
      expect(e.mensaje).toContain('«sald»');
      expect(e.posicion).toBe(8);   // donde empieza «sald» en el texto completo
    });

    it('revisa también las variables dentro de las ramas', () => {
      expect(errores('{si salud > 1: {fantasma} | {objeto:nada}}').length).toBe(2);
    });

    it('avisa de bloques sin cerrar, sin «:» y con más de una «|»', () => {
      expect(errores('Hola {nombre')[0].mensaje).toContain('sin cerrar');
      expect(errores('{si salud > 1 hola}')[0].mensaje).toContain('Falta «:»');
      expect(errores('{si salud > 1: a | b | c}')[0].mensaje).toContain('una «|»');
      expect(errores('{si : a}')[0].mensaje).toContain('Falta la condición');
      expect(errores('{algo raro}')[0].mensaje).toContain('No entiendo este bloque');
    });

    it('{ubicacion} y las llaves escapadas son válidos', () => {
      expect(errores('{ubicacion}')).toEqual([]);
      expect(errores('{{ubicacion}}')).toEqual([]);
    });
  });
});
