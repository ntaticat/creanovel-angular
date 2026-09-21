import {
  agregarEtiquetas, agruparPorEtiqueta, alternarSeleccion, depurarSeleccion, etiquetasDe, filtrarPorEtiquetas, MAX_ETIQUETAS,
  MAX_LONGITUD_ETIQUETA, quitarEtiqueta,
} from './escenas-etiquetas';

describe('escenas-etiquetas', () => {
  const escena = (identificador: string, ...etiquetas: string[]) => ({ identificador, etiquetas });
  const intro = escena('intro', 'Acto 1');
  const bosque = escena('bosque', 'Acto 1', 'Flashback');
  const duelo = escena('duelo', 'acto 2');
  const epilogo = escena('epilogo');
  const todas = [intro, bosque, duelo, epilogo];
  const ids = (escenas: { identificador: string }[]) => escenas.map(e => e.identificador);

  describe('agregarEtiquetas', () => {
    it('recorta, junta espacios y añade al final', () => {
      expect(agregarEtiquetas(['Acto 1'], '  Capítulo   dos ')).toEqual(['Acto 1', 'Capítulo dos']);
    });

    it('admite varias separadas por coma (al pegar) y descarta vacías', () => {
      expect(agregarEtiquetas([], 'a, b,, ,c ')).toEqual(['a', 'b', 'c']);
    });

    it('descarta repetidas sin distinguir mayúsculas y conserva la primera escritura', () => {
      expect(agregarEtiquetas(['Acto 1'], 'acto 1, ACTO 1, Acto 2')).toEqual(['Acto 1', 'Acto 2']);
    });

    it('acorta las que pasan del máximo, como haría el servidor al rechazarlas', () => {
      const [larga] = agregarEtiquetas([], 'x'.repeat(MAX_LONGITUD_ETIQUETA + 5));
      expect(larga.length).toBe(MAX_LONGITUD_ETIQUETA);
    });

    it('se detiene al llegar al máximo de etiquetas', () => {
      const casi = Array.from({ length: MAX_ETIQUETAS - 1 }, (_, i) => `e${i}`);
      expect(agregarEtiquetas(casi, 'nueva, otra, mas')).toEqual([...casi, 'nueva']);
    });

    it('si coincide con una etiqueta ya usada en otra escena, adopta su escritura', () => {
      expect(agregarEtiquetas([], 'acto 2, flashback, Nueva', ['Acto 2', 'Flashback'])).toEqual(['Acto 2', 'Flashback', 'Nueva']);
    });

    it('la escritura de las existentes tampoco cuela repetidas', () => {
      expect(agregarEtiquetas(['Acto 2'], 'acto 2', ['Acto 2'])).toEqual(['Acto 2']);
    });

    it('no modifica la lista recibida', () => {
      const actuales = ['a'];
      agregarEtiquetas(actuales, 'b');
      expect(actuales).toEqual(['a']);
    });
  });

  it('quitarEtiqueta no distingue mayúsculas', () => {
    expect(quitarEtiqueta(['Acto 1', 'Flashback'], 'acto 1')).toEqual(['Flashback']);
  });

  describe('etiquetasDe', () => {
    it('junta las de todas las escenas sin repetir, ordenadas, y gana la primera escritura', () => {
      expect(etiquetasDe(todas)).toEqual(['Acto 1', 'acto 2', 'Flashback']);
    });

    it('trata "Acto 1" y "acto 1" de escenas distintas como la misma etiqueta', () => {
      expect(etiquetasDe([escena('a', 'Acto 1'), escena('b', 'acto 1')])).toEqual(['Acto 1']);
    });

    it('ordena los números como personas (Acto 2 antes que Acto 10)', () => {
      expect(etiquetasDe([escena('a', 'Acto 10', 'Acto 2')])).toEqual(['Acto 2', 'Acto 10']);
    });

    it('tolera escenas sin la propiedad', () => {
      expect(etiquetasDe([{} as { etiquetas: string[] }])).toEqual([]);
    });
  });

  describe('filtrarPorEtiquetas', () => {
    it('sin selección devuelve todas, en su orden', () => {
      expect(ids(filtrarPorEtiquetas(todas, []))).toEqual(['intro', 'bosque', 'duelo', 'epilogo']);
    });

    it('con una etiqueta devuelve las que la tienen', () => {
      expect(ids(filtrarPorEtiquetas(todas, ['Acto 1']))).toEqual(['intro', 'bosque']);
    });

    it('con varias devuelve la unión, sin repetir y en el orden original', () => {
      expect(ids(filtrarPorEtiquetas(todas, ['Flashback', 'Acto 2', 'Acto 1']))).toEqual(['intro', 'bosque', 'duelo']);
    });

    it('no distingue mayúsculas', () => {
      expect(ids(filtrarPorEtiquetas(todas, ['ACTO 2']))).toEqual(['duelo']);
    });

    it('una etiqueta que nadie tiene no deja ninguna escena', () => {
      expect(filtrarPorEtiquetas(todas, ['Nada'])).toEqual([]);
    });
  });

  describe('agruparPorEtiqueta', () => {
    it('una escena aparece en el grupo de cada etiqueta y las sin etiqueta van al final', () => {
      const grupos = agruparPorEtiqueta(todas);

      expect(grupos.map(g => g.etiqueta)).toEqual(['Acto 1', 'acto 2', 'Flashback', null]);
      expect(grupos.map(g => ids(g.escenas))).toEqual([['intro', 'bosque'], ['duelo'], ['bosque'], ['epilogo']]);
    });

    it('sin escenas sin etiqueta no hay grupo nulo', () => {
      expect(agruparPorEtiqueta([intro, bosque]).map(g => g.etiqueta)).toEqual(['Acto 1', 'Flashback']);
    });

    it('sin escenas no hay grupos', () => {
      expect(agruparPorEtiqueta([])).toEqual([]);
    });

    it('con soloEtiquetas forma únicamente esos grupos, sin el de sin etiqueta', () => {
      const grupos = agruparPorEtiqueta(filtrarPorEtiquetas(todas, ['Acto 1', 'acto 2']), ['Acto 1', 'acto 2']);

      expect(grupos.map(g => g.etiqueta)).toEqual(['Acto 1', 'acto 2']);
      expect(grupos.map(g => ids(g.escenas))).toEqual([['intro', 'bosque'], ['duelo']]);
    });
  });

  describe('selección', () => {
    it('alternarSeleccion añade y quita sin modificar la recibida', () => {
      const inicial = ['Acto 1'];

      expect(alternarSeleccion(inicial, 'Flashback')).toEqual(['Acto 1', 'Flashback']);
      expect(alternarSeleccion(inicial, 'acto 1')).toEqual([]);
      expect(inicial).toEqual(['Acto 1']);
    });

    it('depurarSeleccion quita las etiquetas que ya no existen', () => {
      expect(depurarSeleccion(['Acto 1', 'Borrada'], ['Acto 1', 'Flashback'])).toEqual(['Acto 1']);
    });
  });
});
