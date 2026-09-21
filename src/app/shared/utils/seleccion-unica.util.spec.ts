import { SeleccionUnica } from './seleccion-unica.util';

describe('SeleccionUnica', () => {
  let s: SeleccionUnica;
  beforeEach(() => (s = new SeleccionUnica()));

  it('empieza con todo plegado', () => {
    expect([0, 1, 2].some(i => s.esta('variables', i))).toBeFalse();
  });

  it('abrir una tarjeta cierra la que estaba abierta en esa lista', () => {
    s.fijar('variables', 0, true);
    s.fijar('variables', 2, true);

    expect(s.esta('variables', 0)).toBeFalse();
    expect(s.esta('variables', 2)).toBeTrue();
  });

  it('cerrarla la pliega, y cerrar una que no estaba abierta no toca la que sí', () => {
    s.fijar('variables', 1, true);

    s.fijar('variables', 3, false);
    expect(s.esta('variables', 1)).toBeTrue();

    s.fijar('variables', 1, false);
    expect(s.esta('variables', 1)).toBeFalse();
  });

  it('cada lista lleva su propia tarjeta abierta', () => {
    s.fijar('variables', 0, true);
    s.fijar('objetos', 0, true);

    expect(s.esta('variables', 0)).toBeTrue();
    expect(s.esta('objetos', 0)).toBeTrue();

    s.cerrar('variables');
    expect(s.esta('variables', 0)).toBeFalse();
    expect(s.esta('objetos', 0)).toBeTrue();
  });

  describe('alQuitar', () => {
    it('quitar la abierta la cierra', () => {
      s.fijar('l', 2, true);
      s.alQuitar('l', 2);

      expect([0, 1, 2, 3].some(i => s.esta('l', i))).toBeFalse();
    });

    it('quitar una anterior hace que la abierta siga siendo la misma tarjeta (baja una posición)', () => {
      s.fijar('l', 3, true);
      s.alQuitar('l', 1);

      expect(s.esta('l', 2)).toBeTrue();
      expect(s.esta('l', 3)).toBeFalse();
    });

    it('quitar una posterior no cambia nada', () => {
      s.fijar('l', 1, true);
      s.alQuitar('l', 4);

      expect(s.esta('l', 1)).toBeTrue();
    });

    it('sin nada abierto no hace nada', () => {
      s.alQuitar('l', 0);

      expect(s.esta('l', 0)).toBeFalse();
    });
  });
});
