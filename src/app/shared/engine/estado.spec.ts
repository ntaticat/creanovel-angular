import { crearEstadoInicial, logrosNuevos, normalizarEstado, reiniciarPartida } from './estado';
import { DEFS } from './engine-fixtures';

describe('estado', () => {
  it('crea el estado inicial a partir de las definiciones', () => {
    expect(crearEstadoInicial(DEFS).vars).toEqual({
      salud: 90,
      afecto: 0,
      tiene_pareja: false,
      tiempo: 'mañana',
      nombre: '',
    });
  });

  it('sin definiciones el estado está vacío', () => {
    expect(crearEstadoInicial(null).vars).toEqual({});
    expect(crearEstadoInicial(undefined).vars).toEqual({});
  });

  it('el inicial de un texto sin valor cae al primer valor permitido', () => {
    const estado = crearEstadoInicial({
      variables: [{ clave: 'x', etiqueta: 'x', tipo: 'texto', valores: ['a', 'b'], hud: 'oculto' }],
    });
    expect(estado.vars['x']).toBe('a');
  });

  describe('normalizarEstado', () => {
    it('conserva los valores guardados que siguen siendo válidos', () => {
      const estado = normalizarEstado({ vars: { salud: 40, tiene_pareja: true, tiempo: 'noche' } }, DEFS);
      expect(estado.vars['salud']).toBe(40);
      expect(estado.vars['tiene_pareja']).toBeTrue();
      expect(estado.vars['tiempo']).toBe('noche');
      expect(estado.vars['afecto']).toBe(0);
    });

    it('descarta variables que ya no existen', () => {
      const estado = normalizarEstado({ vars: { fantasma: 1 } }, DEFS);
      expect('fantasma' in estado.vars).toBeFalse();
    });

    it('vuelve al inicial si el valor guardado cambió de tipo o salió de los permitidos', () => {
      const estado = normalizarEstado({ vars: { salud: 'mucha', tiempo: 'madrugada', tiene_pareja: 1 } }, DEFS);
      expect(estado.vars['salud']).toBe(90);
      expect(estado.vars['tiempo']).toBe('mañana');
      expect(estado.vars['tiene_pareja']).toBeFalse();
    });

    it('acota los números al rango actual', () => {
      expect(normalizarEstado({ vars: { salud: 500 } }, DEFS).vars['salud']).toBe(100);
    });

    it('tolera basura en lugar del estado', () => {
      const inicial = crearEstadoInicial(DEFS);
      expect(normalizarEstado(null, DEFS)).toEqual(inicial);
      expect(normalizarEstado({}, DEFS)).toEqual(inicial);
      expect(normalizarEstado('x', DEFS)).toEqual(inicial);
      expect(normalizarEstado({ vars: 5 }, DEFS)).toEqual(inicial);
    });
  });

  describe('inventario y ubicación', () => {
    it('el estado inicial trae solo los objetos que se tienen y la ubicación inicial', () => {
      const estado = crearEstadoInicial(DEFS);

      expect(estado.inventario).toEqual({ moneda: 3 });
      expect(estado.ubicacion).toBe('biblioteca');
    });

    it('sin objetos ni ubicaciones definidos el inventario está vacío y no hay ubicación', () => {
      const estado = crearEstadoInicial({ variables: [] });

      expect(estado.inventario).toEqual({});
      expect(estado.ubicacion).toBeNull();
    });

    it('una ubicación inicial que no existe se ignora', () => {
      expect(crearEstadoInicial({ variables: [], ubicaciones: [{ id: 'a', nombre: 'A' }], ubicacionInicial: 'x' }).ubicacion).toBeNull();
    });

    it('la cantidad inicial se acota al tope del objeto', () => {
      const estado = crearEstadoInicial({
        variables: [],
        objetos: [
          { id: 'llave', nombre: 'L', descripcion: '', apilable: false, inicial: 5 },
          { id: 'moneda', nombre: 'M', descripcion: '', apilable: true, max: 10, inicial: 50 },
        ],
      });

      expect(estado.inventario).toEqual({ llave: 1, moneda: 10 });
    });

    it('normalizarEstado conserva inventario y ubicación válidos', () => {
      const estado = normalizarEstado({ vars: {}, inventario: { llave: 1, moneda: 40 }, ubicacion: 'patio' }, DEFS);

      expect(estado.inventario).toEqual({ llave: 1, moneda: 40 });
      expect(estado.ubicacion).toBe('patio');
    });

    it('normalizarEstado acota, descarta lo inválido y lo que ya no existe', () => {
      const estado = normalizarEstado(
        { vars: {}, inventario: { llave: 7, moneda: -1, pocion: 1.5, fantasma: 2 }, ubicacion: 'la_luna' },
        DEFS
      );

      expect(estado.inventario).toEqual({ llave: 1, moneda: 3 });   // llave acotada a 1; moneda inválida vuelve al inicial
      expect('fantasma' in estado.inventario!).toBeFalse();
      expect(estado.ubicacion).toBe('biblioteca');
    });

    it('una partida anterior a los objetos (sin inventario) arranca con el inventario inicial', () => {
      const estado = normalizarEstado({ vars: { salud: 10 } }, DEFS);

      expect(estado.vars['salud']).toBe(10);
      expect(estado.inventario).toEqual({ moneda: 3 });
      expect(estado.ubicacion).toBe('biblioteca');
    });

    it('un objeto en cero se quita del inventario', () => {
      expect(normalizarEstado({ vars: {}, inventario: { moneda: 0 } }, DEFS).inventario).toEqual({});
    });
  });

  describe('logros y finales', () => {
    it('la partida nueva no trae logros ni finales', () => {
      const estado = crearEstadoInicial(DEFS);

      expect(estado.logros).toEqual([]);
      expect(estado.finales).toEqual([]);
    });

    it('normalizarEstado conserva los logros y finales que siguen en el catálogo y descarta el resto', () => {
      const estado = normalizarEstado(
        { vars: {}, logros: ['valiente', 'borrado', 'valiente', 7], finales: ['malo', 'inexistente'] },
        DEFS
      );

      expect(estado.logros).toEqual(['valiente']);
      expect(estado.finales).toEqual(['malo']);
    });

    it('una partida antigua sin logros ni finales se completa con listas vacías', () => {
      const estado = normalizarEstado({ vars: {} }, DEFS);

      expect(estado.logros).toEqual([]);
      expect(estado.finales).toEqual([]);
      expect(normalizarEstado({ vars: {}, logros: 'x', finales: {} }, DEFS).logros).toEqual([]);
    });

    it('empezar de nuevo reinicia todo salvo los logros y finales', () => {
      const jugado = {
        vars: { salud: 5 }, inventario: { llave: 1 }, ubicacion: 'patio', logros: ['valiente'], finales: ['bueno'],
      };

      const nuevo = reiniciarPartida(jugado, DEFS);

      expect(nuevo.vars['salud']).toBe(90);
      expect(nuevo.inventario).toEqual({ moneda: 3 });
      expect(nuevo.ubicacion).toBe('biblioteca');
      expect(nuevo.logros).toEqual(['valiente']);
      expect(nuevo.finales).toEqual(['bueno']);
    });

    it('reiniciar no comparte las listas con el estado anterior', () => {
      const jugado = { vars: {}, logros: ['valiente'], finales: [] as string[] };

      const nuevo = reiniciarPartida(jugado, DEFS);
      nuevo.logros!.push('curioso');

      expect(jugado.logros).toEqual(['valiente']);
    });

    it('logrosNuevos devuelve solo los recién desbloqueados', () => {
      expect(logrosNuevos({ vars: {}, logros: ['a'] }, { vars: {}, logros: ['a', 'b', 'c'] })).toEqual(['b', 'c']);
      expect(logrosNuevos({ vars: {} }, { vars: {}, logros: ['a'] })).toEqual(['a']);
      expect(logrosNuevos({ vars: {}, logros: ['a'] }, { vars: {}, logros: ['a'] })).toEqual([]);
    });
  });
});
