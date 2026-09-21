import { guardarModoSintaxis, leerModoSintaxis, lineaYColumna } from './preferencia-sintaxis.util';

describe('preferencia-sintaxis.util', () => {
  const CLAVE = 'creanovel.editor.sintaxis';
  beforeEach(() => localStorage.removeItem(CLAVE));
  afterEach(() => localStorage.removeItem(CLAVE));

  it('guarda y lee el modo preferido', () => {
    guardarModoSintaxis('texto');
    expect(leerModoSintaxis()).toBe('texto');
    guardarModoSintaxis('visual');
    expect(leerModoSintaxis()).toBe('visual');
  });

  it('sin nada guardado, o con un valor desconocido, el modo es el visual', () => {
    expect(leerModoSintaxis()).toBe('visual');
    localStorage.setItem(CLAVE, 'otra cosa');

    expect(leerModoSintaxis()).toBe('visual');
  });

  it('si el almacenamiento falla, la preferencia sigue valiendo en memoria', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado');
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado');

    guardarModoSintaxis('texto');

    expect(leerModoSintaxis()).toBe('texto');
  });

  it('lineaYColumna cuenta desde 1', () => {
    expect(lineaYColumna('abc', 0)).toEqual({ linea: 1, columna: 1 });
    expect(lineaYColumna('abc\ndef', 5)).toEqual({ linea: 2, columna: 2 });
    expect(lineaYColumna('a\n\nb', 3)).toEqual({ linea: 3, columna: 1 });
    expect(lineaYColumna('abc', -4)).toEqual({ linea: 1, columna: 1 });
  });
});
