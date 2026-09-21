import { IEfecto, IEstadoJuego } from '@models/motor.interfaces';
import { aplicarEfectos, siguienteValor } from './efectos';
import { crearEstadoInicial } from './estado';
import { DEFS } from './engine-fixtures';

describe('aplicarEfectos', () => {
  let estado: IEstadoJuego;
  const aplicar = (efectos: IEfecto[]) => aplicarEfectos(efectos, estado, DEFS);

  beforeEach(() => {
    estado = crearEstadoInicial(DEFS);
  });

  it('suma, resta y multiplica números', () => {
    expect(aplicar([{ var: 'afecto', op: 'sumar', valor: 5 }]).vars['afecto']).toBe(5);
    expect(aplicar([{ var: 'salud', op: 'restar', valor: 30 }]).vars['salud']).toBe(60);
    expect(aplicar([{ var: 'salud', op: 'multiplicar', valor: 0.5 }]).vars['salud']).toBe(45);
  });

  it('acota los números al mínimo y máximo de la variable', () => {
    expect(aplicar([{ var: 'salud', op: 'sumar', valor: 500 }]).vars['salud']).toBe(100);
    expect(aplicar([{ var: 'salud', op: 'restar', valor: 500 }]).vars['salud']).toBe(0);
    expect(aplicar([{ var: 'salud', op: 'fijar', valor: 999 }]).vars['salud']).toBe(100);
  });

  it('una variable sin límites no se acota', () => {
    expect(aplicar([{ var: 'afecto', op: 'restar', valor: 1000 }]).vars['afecto']).toBe(-1000);
  });

  it('fija y alterna booleanos, y fija textos permitidos', () => {
    expect(aplicar([{ var: 'tiene_pareja', op: 'fijar', valor: true }]).vars['tiene_pareja']).toBeTrue();
    expect(aplicar([{ var: 'tiene_pareja', op: 'alternar' }]).vars['tiene_pareja']).toBeTrue();
    expect(aplicar([{ var: 'tiempo', op: 'fijar', valor: 'noche' }]).vars['tiempo']).toBe('noche');
  });

  it('aplica los efectos en orden, viendo el resultado del anterior', () => {
    const resultado = aplicar([
      { var: 'afecto', op: 'sumar', valor: 10 },
      { var: 'afecto', op: 'multiplicar', valor: 3 },
      { var: 'afecto', op: 'restar', valor: 5 },
    ]);
    expect(resultado.vars['afecto']).toBe(25);
  });

  it('no modifica el estado original', () => {
    aplicar([{ var: 'salud', op: 'restar', valor: 50 }]);
    expect(estado.vars['salud']).toBe(90);
  });

  it('ignora los efectos inválidos sin lanzar', () => {
    const resultado = aplicar([
      { var: 'fantasma', op: 'sumar', valor: 1 },
      { var: 'tiempo', op: 'sumar', valor: 1 },          // aritmética sobre texto
      { var: 'salud', op: 'alternar' },                  // alternar sobre número
      { var: 'tiempo', op: 'fijar', valor: 'madrugada' }, // fuera de los valores permitidos
      { var: 'salud', op: 'fijar', valor: true },        // tipo equivocado
      { var: 'salud', op: 'sumar', valor: 'x' as unknown as number },
      { var: 'salud', op: 'sumar' },                     // sin valor
    ]);
    expect(resultado.vars).toEqual(estado.vars);
  });

  it('sin efectos devuelve un estado equivalente', () => {
    expect(aplicarEfectos(null, estado, DEFS)).toEqual(estado);
    expect(aplicarEfectos(undefined, estado, DEFS)).toEqual(estado);
  });

  describe('objetos y ubicación', () => {
    it('da objetos, uno por defecto o la cantidad indicada', () => {
      const r = aplicar([{ objeto: 'llave', op: 'dar' }, { objeto: 'pocion', op: 'dar', cantidad: 4 }]);

      expect(r.inventario).toEqual({ moneda: 3, llave: 1, pocion: 4 });
    });

    it('un objeto no apilable no pasa de 1 y uno apilable respeta su máximo', () => {
      const r = aplicar([{ objeto: 'llave', op: 'dar', cantidad: 5 }, { objeto: 'moneda', op: 'dar', cantidad: 500 }]);

      expect(r.inventario!['llave']).toBe(1);
      expect(r.inventario!['moneda']).toBe(99);
    });

    it('quita objetos sin bajar de cero y quita del inventario lo que llega a cero', () => {
      const r = aplicar([{ objeto: 'moneda', op: 'quitar', cantidad: 1 }]);
      expect(r.inventario!['moneda']).toBe(2);

      const vacio = aplicar([{ objeto: 'moneda', op: 'quitar', cantidad: 50 }]);
      expect('moneda' in vacio.inventario!).toBeFalse();
    });

    it('quitar algo que no se tiene no hace nada', () => {
      expect(aplicar([{ objeto: 'llave', op: 'quitar' }]).inventario).toEqual({ moneda: 3 });
    });

    it('ir cambia la ubicación solo si existe', () => {
      expect(aplicar([{ ir: 'patio' }]).ubicacion).toBe('patio');
      expect(aplicar([{ ir: 'la_luna' }]).ubicacion).toBe('biblioteca');
    });

    it('ignora objetos inexistentes y cantidades inválidas', () => {
      const r = aplicar([
        { objeto: 'fantasma', op: 'dar' },
        { objeto: 'llave', op: 'dar', cantidad: 0 },
        { objeto: 'llave', op: 'dar', cantidad: 1.5 },
      ]);

      expect(r.inventario).toEqual({ moneda: 3 });
    });

    it('mezcla variables, objetos y ubicación en orden y no muta el estado original', () => {
      const r = aplicar([{ var: 'afecto', op: 'sumar', valor: 2 }, { objeto: 'llave', op: 'dar' }, { ir: 'patio' }]);

      expect(r.vars['afecto']).toBe(2);
      expect(r.inventario!['llave']).toBe(1);
      expect(r.ubicacion).toBe('patio');
      expect(estado.inventario).toEqual({ moneda: 3 });
      expect(estado.ubicacion).toBe('biblioteca');
    });

    it('un estado antiguo sin inventario ni ubicación se completa', () => {
      const r = aplicarEfectos([{ objeto: 'llave', op: 'dar' }], { vars: {} }, DEFS);

      expect(r.inventario).toEqual({ llave: 1 });
    });
  });

  describe('avanzar (reloj)', () => {
    const tiempo = (valor: string) => ({ ...estado, vars: { ...estado.vars, tiempo: valor } });

    it('pasa al siguiente valor permitido y da la vuelta al final', () => {
      expect(aplicarEfectos([{ var: 'tiempo', op: 'avanzar' }], tiempo('mañana'), DEFS).vars['tiempo']).toBe('tarde');
      expect(aplicarEfectos([{ var: 'tiempo', op: 'avanzar' }], tiempo('tarde'), DEFS).vars['tiempo']).toBe('noche');
      expect(aplicarEfectos([{ var: 'tiempo', op: 'avanzar' }], tiempo('noche'), DEFS).vars['tiempo']).toBe('mañana');
    });

    it('varios avanzar seguidos recorren el ciclo', () => {
      const r = aplicarEfectos(Array(4).fill({ var: 'tiempo', op: 'avanzar' }), tiempo('mañana'), DEFS);

      expect(r.vars['tiempo']).toBe('tarde');
    });

    it('un valor que ya no está en la lista vuelve al primero', () => {
      expect(siguienteValor('madrugada', ['mañana', 'tarde'])).toBe('mañana');
      expect(siguienteValor('x', [])).toBe('x');
    });

    it('no hace nada en variables que no son de texto con lista de valores', () => {
      const r = aplicarEfectos(
        [{ var: 'salud', op: 'avanzar' }, { var: 'nombre', op: 'avanzar' }, { var: 'tiene_pareja', op: 'avanzar' }],
        estado,
        DEFS
      );

      expect(r.vars).toEqual(estado.vars);
    });
  });

  describe('logros', () => {
    it('desbloquea un logro una sola vez', () => {
      const r = aplicar([{ logro: 'valiente' }, { logro: 'valiente' }, { logro: 'curioso' }]);

      expect(r.logros).toEqual(['valiente', 'curioso']);
    });

    it('un logro que no existe se ignora y los finales no se tocan', () => {
      const conFinal = { ...estado, finales: ['bueno'] };

      const r = aplicarEfectos([{ logro: 'fantasma' }], conFinal, DEFS);

      expect(r.logros).toEqual([]);
      expect(r.finales).toEqual(['bueno']);
    });

    it('conserva los logros que ya se tenían', () => {
      const r = aplicarEfectos([{ logro: 'curioso' }], { ...estado, logros: ['valiente'] }, DEFS);

      expect(r.logros).toEqual(['valiente', 'curioso']);
    });
  });
});
