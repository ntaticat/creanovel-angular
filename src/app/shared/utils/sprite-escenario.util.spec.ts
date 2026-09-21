import {
  ASPECTO_ESCENARIO,
  cajaDelSprite,
  colocacionInicial,
  ESCALA_MAXIMA,
  ESCALA_MINIMA,
  escalarColocacion,
  estiloSpriteEscenario,
  limitarColocacion,
  MAX_PERSONAJES_ESCENARIO,
  moverColocacion,
} from './sprite-escenario.util';

describe('sprite-escenario.util', () => {
  const base = { x: 50, y: 50, escala: 1, espejo: false };

  describe('estiloSpriteEscenario', () => {
    it('un sprite centrado y a tamaño base no se desplaza ni se escala', () => {
      expect(estiloSpriteEscenario(base)['transform']).toBe('translate(0%, 0%) scale(1, 1)');
    });

    it('desplaza el centro del sprite a (x, y) y lo escala respecto a su propio centro', () => {
      expect(estiloSpriteEscenario({ x: 25, y: 80, escala: 1.5, espejo: false })['transform']).toBe('translate(-25%, 30%) scale(1.5, 1.5)');
    });

    it('voltear invierte solo el eje horizontal', () => {
      expect(estiloSpriteEscenario({ ...base, escala: 2, espejo: true })['transform']).toBe('translate(0%, 0%) scale(-2, 2)');
    });
  });

  describe('limitarColocacion', () => {
    it('deja dentro del escenario el centro y dentro de rango la escala', () => {
      expect(limitarColocacion({ ...base, x: -20, y: 130, escala: 9 })).toEqual({ x: 0, y: 100, escala: ESCALA_MAXIMA, espejo: false });
      expect(limitarColocacion({ ...base, escala: 0.001 }).escala).toBe(ESCALA_MINIMA);
    });

    it('redondea para no guardar ruido de coma flotante', () => {
      expect(limitarColocacion({ ...base, x: 33.3333333, y: 66.6666667, escala: 1.23456 })).toEqual({ x: 33.3, y: 66.7, escala: 1.23, espejo: false });
    });

    it('conserva los demás campos (como el id del sprite)', () => {
      const r = limitarColocacion({ ...base, personajeSpriteId: 'abc' });

      expect(r.personajeSpriteId).toBe('abc');
    });
  });

  it('moverColocacion desplaza y no saca el centro del escenario', () => {
    expect(moverColocacion(base, 10, -5)).toEqual({ x: 60, y: 45, escala: 1, espejo: false });
    expect(moverColocacion(base, 80, 80)).toEqual({ x: 100, y: 100, escala: 1, espejo: false });
  });

  it('escalarColocacion multiplica y respeta los límites', () => {
    expect(escalarColocacion(base, 1.5).escala).toBe(1.5);
    expect(escalarColocacion({ ...base, escala: 3.9 }, 2).escala).toBe(ESCALA_MAXIMA);
    expect(escalarColocacion({ ...base, escala: 0.11 }, 0.1).escala).toBe(ESCALA_MINIMA);
  });

  describe('colocacionInicial', () => {
    it('el primero va al centro y los siguientes a los lados, para no taparse', () => {
      const xs = [0, 1, 2].map(n => colocacionInicial(n).x);

      expect(xs).toEqual([50, 25, 75]);
    });

    it('cabe todo el máximo de personajes con posiciones dentro del escenario y escala válida', () => {
      const todos = Array.from({ length: MAX_PERSONAJES_ESCENARIO }, (_, n) => colocacionInicial(n));

      expect(new Set(todos.map(c => c.x)).size).toBe(MAX_PERSONAJES_ESCENARIO);
      expect(todos.every(c => c.x >= 0 && c.x <= 100 && c.y >= 0 && c.y <= 100)).toBeTrue();
      expect(todos.every(c => c.escala >= ESCALA_MINIMA && c.escala <= ESCALA_MAXIMA)).toBeTrue();
    });

    it('un sprite nuevo no está volteado', () => {
      expect(colocacionInicial(0).espejo).toBeFalse();
    });
  });

  describe('cajaDelSprite', () => {
    it('un sprite alto se ve entero llenando el alto del escenario', () => {
      // 300 x 600 (proporción 0.5) en un escenario 16:9 → alto 100 %, ancho = 0.5 / 1.777… = 28.13 %
      expect(cajaDelSprite(0.5)).toEqual({ ancho: 28.13, alto: 100 });
    });

    it('un sprite más ancho que el escenario llena el ancho y sobra alto', () => {
      // 600 x 300 (proporción 2) → ancho 100 %, alto = 1.777… / 2 = 88.89 %
      expect(cajaDelSprite(2)).toEqual({ ancho: 100, alto: 88.89 });
    });

    it('un sprite con la proporción del escenario lo llena', () => {
      expect(cajaDelSprite(ASPECTO_ESCENARIO)).toEqual({ ancho: 100, alto: 100 });
    });

    it('una proporción inválida cae a la caja completa', () => {
      [0, -1, NaN, Infinity].forEach(a => expect(cajaDelSprite(a)).toEqual({ ancho: 100, alto: 100 }));
    });

    it('la caja siempre respeta la proporción del sprite (no lo deforma)', () => {
      [0.3, 0.75, 1, 1.5, 2.5, 4].forEach(aspecto => {
        const { ancho, alto } = cajaDelSprite(aspecto);
        expect((ancho / alto) * ASPECTO_ESCENARIO).toBeCloseTo(aspecto, 1);
      });
    });
  });

  it('el máximo coincide con el del backend', () => {
    expect(MAX_PERSONAJES_ESCENARIO).toBe(8);
    expect([ESCALA_MINIMA, ESCALA_MAXIMA]).toEqual([0.1, 4]);
  });
});
