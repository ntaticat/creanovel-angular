import { IDefiniciones, IEstadoJuego } from '@models/motor.interfaces';
import { IDecision, IEntrada, ITermina, MixRecursosType } from '@models/recurso.interfaces';
import { MAX_PASOS_AUTOMATICOS, NovelaMotor } from './motor';
import { asigna, DEFS, evalua, explora, habla, juega, selecciona } from './engine-fixtures';

const mapa = (...recursos: MixRecursosType[]) => new Map(recursos.map(r => [r.recursoId, r]));

describe('NovelaMotor', () => {
  describe('resolver', () => {
    it('un recurso presentable se devuelve tal cual', () => {
      const motor = new NovelaMotor(mapa(habla('a')), DEFS);
      const r = motor.resolver('a', motor.estadoInicial());

      expect(r.recurso?.recursoId).toBe('a');
      expect(r.fin).toBeFalse();
    });

    it('Asigna aplica sus efectos y continúa hasta el siguiente presentable', () => {
      const motor = new NovelaMotor(
        mapa(
          asigna('as', [{ var: 'salud', op: 'restar', valor: 30 }, { var: 'tiene_pareja', op: 'fijar', valor: true }], 'fin'),
          habla('fin')
        ),
        DEFS
      );

      const r = motor.resolver('as', motor.estadoInicial());

      expect(r.recurso?.recursoId).toBe('fin');
      expect(r.estado.vars['salud']).toBe(60);
      expect(r.estado.vars['tiene_pareja']).toBeTrue();
    });

    it('Evalua toma la primera rama que se cumple, por orden', () => {
      const ev = evalua(
        'ev',
        [
          { condicion: { var: 'salud', op: '>=', valor: 50 }, siguienteRecursoId: 'sano' },
          { condicion: { var: 'salud', op: '>=', valor: 10 }, siguienteRecursoId: 'herido' },
        ],
        'muerto'
      );
      const motor = new NovelaMotor(mapa(ev, habla('sano'), habla('herido'), habla('muerto')), DEFS);
      const conSalud = (salud: number): IEstadoJuego => ({ vars: { ...motor.estadoInicial().vars, salud } });

      expect(motor.resolver('ev', conSalud(90)).recurso?.recursoId).toBe('sano');
      expect(motor.resolver('ev', conSalud(20)).recurso?.recursoId).toBe('herido');
      expect(motor.resolver('ev', conSalud(5)).recurso?.recursoId).toBe('muerto');
    });

    it('respeta el orden de las ramas aunque lleguen desordenadas', () => {
      const ev = evalua('ev', [
        { orden: 5, condicion: { var: 'salud', op: '>', valor: 0 }, siguienteRecursoId: 'segunda' },
        { orden: 1, condicion: { var: 'salud', op: '>', valor: 0 }, siguienteRecursoId: 'primera' },
      ]);
      const motor = new NovelaMotor(mapa(ev, habla('primera'), habla('segunda')), DEFS);

      expect(motor.resolver('ev', motor.estadoInicial()).recurso?.recursoId).toBe('primera');
    });

    it('aplica los efectos de la rama elegida', () => {
      const ev = evalua('ev', [
        { condicion: { var: 'salud', op: '>', valor: 0 }, siguienteRecursoId: 'a', efectos: [{ var: 'afecto', op: 'sumar', valor: 7 }] },
      ]);
      const motor = new NovelaMotor(mapa(ev, habla('a')), DEFS);

      expect(motor.resolver('ev', motor.estadoInicial()).estado.vars['afecto']).toBe(7);
    });

    it('encadena Evalua → Asigna → Evalua sobre el estado ya modificado', () => {
      const motor = new NovelaMotor(
        mapa(
          asigna('as', [{ var: 'afecto', op: 'sumar', valor: 60 }], 'ev'),
          evalua('ev', [{ condicion: { var: 'afecto', op: '>=', valor: 50 }, siguienteRecursoId: 'romance' }], 'amigos'),
          habla('romance'),
          habla('amigos')
        ),
        DEFS
      );

      expect(motor.resolver('as', motor.estadoInicial()).recurso?.recursoId).toBe('romance');
    });

    it('sin rama que cumpla y sin sino, la historia termina', () => {
      const ev = evalua('ev', [{ condicion: { var: 'salud', op: '<', valor: 0 }, siguienteRecursoId: 'a' }]);
      const motor = new NovelaMotor(mapa(ev, habla('a')), DEFS);

      const r = motor.resolver('ev', motor.estadoInicial());

      expect(r.fin).toBeTrue();
      expect(r.recurso).toBeUndefined();
      expect(r.error).toBeUndefined();
    });

    it('un Asigna sin siguiente termina la historia y conserva sus efectos', () => {
      const motor = new NovelaMotor(mapa(asigna('as', [{ var: 'afecto', op: 'sumar', valor: 1 }])), DEFS);

      const r = motor.resolver('as', motor.estadoInicial());

      expect(r.fin).toBeTrue();
      expect(r.estado.vars['afecto']).toBe(1);
    });

    it('un recurso inexistente se reporta', () => {
      const motor = new NovelaMotor(mapa(), DEFS);

      expect(motor.resolver('nada', motor.estadoInicial())).toEqual(jasmine.objectContaining({ fin: true, error: 'no_encontrado' }));
    });

    it('resolver(undefined) es el fin', () => {
      const motor = new NovelaMotor(mapa(), DEFS);

      expect(motor.resolver(undefined, motor.estadoInicial()).fin).toBeTrue();
    });

    it('un bucle solo de nodos automáticos se corta y no cuelga el navegador', () => {
      const motor = new NovelaMotor(
        mapa(asigna('a', [{ var: 'afecto', op: 'sumar', valor: 1 }], 'b'), asigna('b', [{ var: 'afecto', op: 'sumar', valor: 1 }], 'a')),
        DEFS
      );

      const r = motor.resolver('a', motor.estadoInicial());

      expect(r.error).toBe('ciclo');
      expect(r.fin).toBeTrue();
      expect(r.estado.vars['afecto']).toBeGreaterThanOrEqual(MAX_PASOS_AUTOMATICOS);
    });

    it('un bucle legítimo con contador termina cuando la condición lo corta', () => {
      const motor = new NovelaMotor(
        mapa(
          evalua('ev', [{ condicion: { var: 'afecto', op: '<', valor: 3 }, siguienteRecursoId: 'as' }], 'salida'),
          asigna('as', [{ var: 'afecto', op: 'sumar', valor: 1 }], 'ev'),
          habla('salida')
        ),
        DEFS
      );

      const r = motor.resolver('ev', motor.estadoInicial());

      expect(r.recurso?.recursoId).toBe('salida');
      expect(r.estado.vars['afecto']).toBe(3);
    });
  });

  describe('opcionesDe / elegirOpcion', () => {
    const decision = (): IDecision =>
      selecciona('sel', [
        { opcionMensaje: 'Siempre', siguienteRecursoId: 'x' },
        { opcionMensaje: 'Solo sano', siguienteRecursoId: 'y', condicion: { var: 'salud', op: '>=', valor: 50 }, condicionModo: 'ocultar' },
        { opcionMensaje: 'Solo con pareja', siguienteRecursoId: 'z', condicion: { var: 'tiene_pareja', op: '==', valor: true }, condicionModo: 'deshabilitar' },
        { opcionMensaje: 'Sin destino' },
      ]);
    const motor = new NovelaMotor(mapa(), DEFS);

    it('oculta las opciones cuya condición falla en modo ocultar y muestra inactivas las de modo deshabilitar', () => {
      const opciones = motor.opcionesDe(decision(), { vars: { ...motor.estadoInicial().vars, salud: 10 } });

      expect(opciones.map(o => o.mensaje)).toEqual(['Siempre', 'Solo con pareja', 'Sin destino']);
      expect(opciones.map(o => o.habilitada)).toEqual([true, false, false]);
    });

    it('cuando la condición se cumple la opción aparece habilitada', () => {
      const opciones = motor.opcionesDe(decision(), {
        vars: { ...motor.estadoInicial().vars, salud: 80, tiene_pareja: true },
      });

      expect(opciones.map(o => o.mensaje)).toEqual(['Siempre', 'Solo sano', 'Solo con pareja', 'Sin destino']);
      expect(opciones.map(o => o.habilitada)).toEqual([true, true, true, false]);
    });

    it('ordena por `orden`', () => {
      const d = decision();
      d.opciones![0].orden = 9;

      expect(motor.opcionesDe(d, motor.estadoInicial())[0].mensaje).not.toBe('Siempre');
    });

    it('hayOpcionDisponible es falso si todas están ocultas o inactivas', () => {
      const d = selecciona('sel', [{ siguienteRecursoId: 'x', condicion: { var: 'salud', op: '<', valor: 0 } }]);

      expect(motor.hayOpcionDisponible(d, motor.estadoInicial())).toBeFalse();
      expect(motor.hayOpcionDisponible(decision(), motor.estadoInicial())).toBeTrue();
    });

    it('elegir una opción aplica sus efectos y devuelve el destino', () => {
      const d = selecciona('sel', [{ siguienteRecursoId: 'x', efectos: [{ var: 'salud', op: 'sumar', valor: -20 }, { var: 'afecto', op: 'sumar', valor: 5 }] }]);

      const eleccion = motor.elegirOpcion(d, d.opciones![0].recursoDecisionOpcionId, motor.estadoInicial());

      expect(eleccion?.destinoId).toBe('x');
      expect(eleccion?.estado.vars['salud']).toBe(70);
      expect(eleccion?.estado.vars['afecto']).toBe(5);
    });

    it('no deja elegir una opción cuya condición no se cumple ni una inexistente', () => {
      const d = decision();
      const soloSano = d.opciones![1].recursoDecisionOpcionId;
      const bajo: IEstadoJuego = { vars: { ...motor.estadoInicial().vars, salud: 10 } };

      expect(motor.elegirOpcion(d, soloSano, bajo)).toBeUndefined();
      expect(motor.elegirOpcion(d, 'no-existe', bajo)).toBeUndefined();
    });
  });

  describe('aplicarEntrada', () => {
    const motor = new NovelaMotor(mapa(), DEFS);
    const pide = (clave: string) => ({ clave, etiqueta: '¿?', valor: '', placeholder: '' }) as IEntrada;

    it('guarda texto en la variable', () => {
      expect(motor.aplicarEntrada(pide('nombre'), '  Ana ', motor.estadoInicial()).vars['nombre']).toBe('Ana');
    });

    it('convierte y acota números; rechaza los que no lo son', () => {
      const inicial = motor.estadoInicial();

      expect(motor.aplicarEntrada(pide('salud'), '250', inicial).vars['salud']).toBe(100);
      expect(motor.aplicarEntrada(pide('salud'), 'abc', inicial)).toBe(inicial);
      expect(motor.aplicarEntrada(pide('salud'), '', inicial)).toBe(inicial);
    });

    it('respeta los valores permitidos y no toca variables inexistentes', () => {
      const inicial = motor.estadoInicial();

      expect(motor.aplicarEntrada(pide('tiempo'), 'madrugada', inicial)).toBe(inicial);
      expect(motor.aplicarEntrada(pide('fantasma'), 'x', inicial)).toBe(inicial);
    });
  });

  describe('hud', () => {
    it('solo muestra variables no ocultas; la barra requiere un número', () => {
      const motor = new NovelaMotor(mapa(), DEFS);

      const hud = motor.hud(motor.estadoInicial());

      expect(hud.map(h => h.clave)).toEqual(['salud', 'afecto']);
      expect(hud[0]).toEqual(jasmine.objectContaining({ tipo: 'barra', valor: 90, min: 0, max: 100 }));
      expect(hud[1].tipo).toBe('numero');
    });
  });

  describe('Explora, inventario y ubicación', () => {
    const motor = new NovelaMotor(mapa(), DEFS);

    it('un Explora es un recurso presentable', () => {
      const m = new NovelaMotor(mapa(explora('ex', [{ siguienteRecursoId: 'a' }]), habla('a')), DEFS);

      const r = m.resolver('ex', m.estadoInicial());

      expect(r.recurso?.recursoId).toBe('ex');
      expect(r.fin).toBeFalse();
    });

    it('zonasDe muestra las zonas con su región, ordenadas, y oculta o deshabilita según la condición', () => {
      const ex = explora('ex', [
        { opcionMensaje: 'Puerta', siguienteRecursoId: 'a', condicion: { objeto: 'llave', op: '>=', valor: 1 }, condicionModo: 'deshabilitar' },
        { opcionMensaje: 'Estante', siguienteRecursoId: 'b', condicion: { en: 'patio' }, condicionModo: 'ocultar' },
        { opcionMensaje: 'Ventana', siguienteRecursoId: 'c' },
      ]);

      const zonas = motor.zonasDe(ex, motor.estadoInicial());

      expect(zonas.map(z => z.etiqueta)).toEqual(['Puerta', 'Ventana']);          // Estante oculta: no está en patio
      expect(zonas.map(z => z.habilitada)).toEqual([false, true]);                  // Puerta deshabilitada: sin llave
      expect(zonas[0].region).toEqual({ x: 10, y: 10, ancho: 20, alto: 20 });
    });

    it('una zona que solo cambia el estado (recoger un objeto) está habilitada sin destino', () => {
      const ex = explora('ex', [
        { opcionMensaje: 'Cofre', efectos: [{ objeto: 'llave', op: 'dar' }] },
        { opcionMensaje: 'Decorado' },
      ]);

      expect(motor.zonasDe(ex, motor.estadoInicial()).map(z => z.habilitada)).toEqual([true, false]);
    });

    it('ignora las opciones que no son zonas o no traen región', () => {
      const ex = explora('ex', [{ tipo: 'opcion' }, { region: null }, { opcionMensaje: 'Buena' }]);

      expect(motor.zonasDe(ex, motor.estadoInicial()).map(z => z.etiqueta)).toEqual(['Buena']);
    });

    it('elegir una zona aplica sus efectos (dar un objeto, ir a otro lugar) y devuelve el destino', () => {
      const ex = explora('ex', [
        { siguienteRecursoId: 'patio_ex', efectos: [{ objeto: 'llave', op: 'dar' }, { ir: 'patio' }] },
      ]);

      const eleccion = motor.elegirOpcion(ex, ex.opciones![0].recursoDecisionOpcionId, motor.estadoInicial());

      expect(eleccion?.destinoId).toBe('patio_ex');
      expect(eleccion?.estado.inventario!['llave']).toBe(1);
      expect(eleccion?.estado.ubicacion).toBe('patio');
    });

    it('no deja elegir una zona oculta por su condición', () => {
      const ex = explora('ex', [{ siguienteRecursoId: 'a', condicion: { objeto: 'llave', op: '>=', valor: 1 } }]);

      expect(motor.elegirOpcion(ex, ex.opciones![0].recursoDecisionOpcionId, motor.estadoInicial())).toBeUndefined();
    });

    it('hayOpcionDisponible cubre las zonas', () => {
      const cerrado = explora('ex', [{ siguienteRecursoId: 'a', condicion: { objeto: 'llave', op: '>=', valor: 1 } }]);
      const abierto = explora('ex', [{ siguienteRecursoId: 'a' }]);

      expect(motor.hayOpcionDisponible(cerrado, motor.estadoInicial())).toBeFalse();
      expect(motor.hayOpcionDisponible(abierto, motor.estadoInicial())).toBeTrue();
    });

    it('un Evalúa puede ramificar por objeto y ubicación (hub de un mundo)', () => {
      const m = new NovelaMotor(
        mapa(
          asigna('as', [{ objeto: 'llave', op: 'dar' }, { ir: 'patio' }], 'ev'),
          evalua('ev', [{ condicion: { y: [{ en: 'patio' }, { objeto: 'llave', op: '>=', valor: 1 }] }, siguienteRecursoId: 'salida' }], 'nada'),
          habla('salida'),
          habla('nada')
        ),
        DEFS
      );

      expect(m.resolver('as', m.estadoInicial()).recurso?.recursoId).toBe('salida');
      expect(m.resolver('ev', m.estadoInicial()).recurso?.recursoId).toBe('nada');
    });

    it('mochila lista lo que se tiene, en orden de definición, con nombre y cantidad', () => {
      const estado = { vars: {}, inventario: { pocion: 2, moneda: 7 }, ubicacion: null };

      const items = motor.mochila(estado);

      expect(items.map(i => [i.id, i.cantidad])).toEqual([['moneda', 7], ['pocion', 2]]);
      expect(items[0]).toEqual(jasmine.objectContaining({ nombre: 'Moneda', apilable: true }));
      expect(motor.mochila({ vars: {} })).toEqual([]);
    });

    it('tieneObjetos depende de las definiciones', () => {
      expect(motor.tieneObjetos).toBeTrue();
      expect(new NovelaMotor(mapa(), { variables: [] }).tieneObjetos).toBeFalse();
    });

    it('ubicacionDe devuelve la ubicación actual', () => {
      expect(motor.ubicacionDe({ vars: {}, ubicacion: 'patio' })?.nombre).toBe('Patio');
      expect(motor.ubicacionDe({ vars: {}, ubicacion: null })).toBeUndefined();
    });

    it('aplicarEntrada conserva el inventario y la ubicación', () => {
      const estado = { vars: { nombre: '' }, inventario: { llave: 1 }, ubicacion: 'patio' };
      const pide = { clave: 'nombre' } as IEntrada;

      const r = motor.aplicarEntrada(pide, 'Ana', estado);

      expect(r.vars['nombre']).toBe('Ana');
      expect(r.inventario).toEqual({ llave: 1 });
      expect(r.ubicacion).toBe('patio');
    });
  });

  describe('usar objetos', () => {
    const defs: IDefiniciones = {
      ...DEFS,
      objetos: [
        {
          id: 'pocion', nombre: 'Poción', descripcion: '', apilable: true, max: null, inicial: 0,
          uso: { etiqueta: 'Beber', consumir: true, efectos: [{ var: 'salud', op: 'sumar', valor: 20 }, { objeto: 'botella', op: 'dar' }] },
        },
        { id: 'botella', nombre: 'Botella', descripcion: '', apilable: true, max: null, inicial: 0 },
        {
          id: 'mapa', nombre: 'Mapa', descripcion: '', apilable: false, inicial: 0,
          uso: { etiqueta: '', consumir: false, destinoRecursoId: 'plaza', condicion: { en: 'patio' } },
        },
        {
          id: 'amuleto', nombre: 'Amuleto', descripcion: '', apilable: false, inicial: 0,
          uso: { etiqueta: 'Frotar', consumir: false, efectos: [{ var: 'afecto', op: 'sumar', valor: 1 }, { logro: 'curioso' }] },
        },
        { id: 'piedra', nombre: 'Piedra', descripcion: '', apilable: true, max: null, inicial: 0 },
      ],
    };
    const motor = new NovelaMotor(mapa(), defs);
    const con = (inventario: Record<string, number>, ubicacion: string | null = 'biblioteca'): IEstadoJuego => ({
      ...motor.estadoInicial(),
      inventario,
      ubicacion,
    });

    it('la mochila indica qué objetos se pueden usar, con su texto de botón (Usar por defecto)', () => {
      const items = motor.mochila(con({ pocion: 1, mapa: 1, piedra: 4 }, 'patio'));

      expect(items.find(i => i.id === 'pocion')?.uso).toEqual({ etiqueta: 'Beber', habilitado: true, llevaANodo: false });
      expect(items.find(i => i.id === 'mapa')?.uso).toEqual({ etiqueta: 'Usar', habilitado: true, llevaANodo: true });
      expect(items.find(i => i.id === 'piedra')?.uso).toBeUndefined();
    });

    it('la condición del uso lo habilita o deshabilita según el estado', () => {
      const uso = (ubicacion: string) => motor.mochila(con({ mapa: 1 }, ubicacion))[0].uso;

      expect(uso('biblioteca')?.habilitado).toBeFalse();
      expect(uso('patio')?.habilitado).toBeTrue();
    });

    it('aplica los efectos y gasta una unidad si es consumible', () => {
      const r = motor.usarObjeto('pocion', { ...con({ pocion: 3 }), vars: { ...motor.estadoInicial().vars, salud: 50 } });

      expect(r?.estado.vars['salud']).toBe(70);
      expect(r?.estado.inventario?.['pocion']).toBe(2);
      expect(r?.destinoId).toBeUndefined();
    });

    it('gasta antes de aplicar los efectos: la última unidad puede devolver otro objeto', () => {
      const r = motor.usarObjeto('pocion', con({ pocion: 1 }));

      expect(r?.estado.inventario?.['pocion']).toBeUndefined();
      expect(r?.estado.inventario?.['botella']).toBe(1);
    });

    it('un objeto no consumible se conserva y puede desbloquear un logro', () => {
      const r = motor.usarObjeto('amuleto', con({ amuleto: 1 }));

      expect(r?.estado.inventario?.['amuleto']).toBe(1);
      expect(r?.estado.vars['afecto']).toBe(1);
      expect(r?.estado.logros).toContain('curioso');
    });

    it('devuelve el nodo destino cuando el objeto lleva a uno', () => {
      const r = motor.usarObjeto('mapa', con({ mapa: 1 }, 'patio'));

      expect(r?.destinoId).toBe('plaza');
      expect(r?.estado.inventario?.['mapa']).toBe(1);
    });

    it('no se puede usar si no se tiene, si no tiene uso, si no existe o si la condición no se cumple', () => {
      expect(motor.usarObjeto('pocion', con({}))).toBeUndefined();
      expect(motor.usarObjeto('piedra', con({ piedra: 2 }))).toBeUndefined();
      expect(motor.usarObjeto('fantasma', con({ pocion: 1 }))).toBeUndefined();
      expect(motor.usarObjeto('mapa', con({ mapa: 1 }, 'biblioteca'))).toBeUndefined();
    });

    it('no modifica el estado original', () => {
      const estado = con({ pocion: 2 });

      motor.usarObjeto('pocion', estado);

      expect(estado.inventario?.['pocion']).toBe(2);
    });
  });

  describe('Juega (minijuegos)', () => {
    const motor = new NovelaMotor(mapa(), DEFS);

    it('un Juega es un recurso presentable', () => {
      const j = juega('j', { exito: { siguienteRecursoId: 'a' }, fallo: { siguienteRecursoId: 'b' } });
      const m = new NovelaMotor(mapa(j, habla('a'), habla('b')), DEFS);

      const r = m.resolver('j', m.estadoInicial());

      expect(r.recurso?.recursoId).toBe('j');
      expect(r.fin).toBeFalse();
    });

    it('el éxito sigue por la salida de éxito y el fallo por la de fallo', () => {
      const j = juega('j', { exito: { siguienteRecursoId: 'gana' }, fallo: { siguienteRecursoId: 'pierde' } });

      expect(motor.resolverMinijuego(j, { exito: true, puntaje: 5 }, motor.estadoInicial()).destinoId).toBe('gana');
      expect(motor.resolverMinijuego(j, { exito: false, puntaje: 1 }, motor.estadoInicial()).destinoId).toBe('pierde');
    });

    it('aplica solo los efectos de la salida elegida', () => {
      const j = juega('j', {
        exito: { siguienteRecursoId: 'a', efectos: [{ objeto: 'llave', op: 'dar' }] },
        fallo: { siguienteRecursoId: 'b', efectos: [{ var: 'salud', op: 'restar', valor: 30 }] },
      });

      const gana = motor.resolverMinijuego(j, { exito: true, puntaje: 5 }, motor.estadoInicial());
      const pierde = motor.resolverMinijuego(j, { exito: false, puntaje: 0 }, motor.estadoInicial());

      expect(gana.estado.inventario!['llave']).toBe(1);
      expect(gana.estado.vars['salud']).toBe(90);
      expect(pierde.estado.vars['salud']).toBe(60);
      expect(pierde.estado.inventario!['llave']).toBeUndefined();
    });

    it('guarda el puntaje en la variable de resultado, acotado a su rango', () => {
      const j = juega('j', { exito: { siguienteRecursoId: 'a' } }, { variableResultado: 'salud' });

      expect(motor.resolverMinijuego(j, { exito: true, puntaje: 42 }, motor.estadoInicial()).estado.vars['salud']).toBe(42);
      expect(motor.resolverMinijuego(j, { exito: true, puntaje: 500 }, motor.estadoInicial()).estado.vars['salud']).toBe(100);
    });

    it('el puntaje se guarda aunque se falle, y se puede usar después en un Evalúa', () => {
      const j = juega('j', { fallo: { siguienteRecursoId: 'ev' } }, { variableResultado: 'afecto' });
      const m = new NovelaMotor(
        mapa(j, evalua('ev', [{ condicion: { var: 'afecto', op: '>=', valor: 3 }, siguienteRecursoId: 'casi' }], 'mal'), habla('casi'), habla('mal')),
        DEFS
      );

      const eleccion = m.resolverMinijuego(j, { exito: false, puntaje: 3 }, m.estadoInicial());

      expect(eleccion.estado.vars['afecto']).toBe(3);
      expect(m.resolver(eleccion.destinoId, eleccion.estado).recurso?.recursoId).toBe('casi');
    });

    it('sin variable de resultado o con una que no es numérica no toca las variables', () => {
      const sin = juega('j', { exito: { siguienteRecursoId: 'a' } });
      const texto = juega('j', { exito: { siguienteRecursoId: 'a' } }, { variableResultado: 'nombre' });
      const inexistente = juega('j', { exito: { siguienteRecursoId: 'a' } }, { variableResultado: 'fantasma' });
      const inicial = motor.estadoInicial();

      for (const j of [sin, texto, inexistente]) {
        expect(motor.resolverMinijuego(j, { exito: true, puntaje: 9 }, inicial).estado.vars).toEqual(inicial.vars);
      }
    });

    it('una salida sin destino termina la historia; una salida que falta también', () => {
      const soloEfectos = juega('j', { exito: { efectos: [{ objeto: 'llave', op: 'dar' }] } });
      const sinFallo = juega('j', { exito: { siguienteRecursoId: 'a' } });

      const a = motor.resolverMinijuego(soloEfectos, { exito: true, puntaje: 1 }, motor.estadoInicial());
      expect(a.destinoId).toBeUndefined();
      expect(a.estado.inventario!['llave']).toBe(1);

      expect(motor.resolverMinijuego(sinFallo, { exito: false, puntaje: 0 }, motor.estadoInicial()).destinoId).toBeUndefined();
    });

    it('la salida de fallo puede volver al mismo nodo (reintentar)', () => {
      const j = juega('j', { exito: { siguienteRecursoId: 'a' }, fallo: { siguienteRecursoId: 'j' } });
      const m = new NovelaMotor(mapa(j, habla('a')), DEFS);

      const eleccion = m.resolverMinijuego(j, { exito: false, puntaje: 0 }, m.estadoInicial());

      expect(m.resolver(eleccion.destinoId, eleccion.estado).recurso?.recursoId).toBe('j');
    });
  });

  describe('textos con variables', () => {
    const motor = new NovelaMotor(mapa(), DEFS);
    const estado: IEstadoJuego = { ...motor.estadoInicial(), vars: { ...motor.estadoInicial().vars, nombre: 'Ana', salud: 40 } };

    it('las opciones y las zonas sustituyen las variables de su texto', () => {
      const sel = selecciona('sel', [{ opcionMensaje: 'Ayudar a {nombre} ({salud} de salud)', siguienteRecursoId: 'x' }]);
      const ex = explora('ex', [{ opcionMensaje: 'Puerta de {nombre}', siguienteRecursoId: 'x' }]);

      expect(motor.opcionesDe(sel, estado)[0].mensaje).toBe('Ayudar a Ana (40 de salud)');
      expect(motor.zonasDe(ex, estado)[0].etiqueta).toBe('Puerta de Ana');
    });

    it('un texto condicional cambia con el estado', () => {
      const sel = selecciona('sel', [{ opcionMensaje: 'Seguir{si salud < 50:, aunque duele}', siguienteRecursoId: 'x' }]);

      expect(motor.opcionesDe(sel, estado)[0].mensaje).toBe('Seguir, aunque duele');
      expect(motor.opcionesDe(sel, motor.estadoInicial())[0].mensaje).toBe('Seguir');
    });

    it('elegir una opción no depende del texto mostrado', () => {
      const sel = selecciona('sel', [{ opcionMensaje: '{nombre}', siguienteRecursoId: 'x' }]);

      expect(motor.elegirOpcion(sel, sel.opciones![0].recursoDecisionOpcionId, estado)?.destinoId).toBe('x');
    });

    it('texto() sustituye lo mismo que el resto', () => {
      expect(motor.texto('Hola {nombre}', estado)).toBe('Hola Ana');
    });
  });

  describe('finales y logros', () => {
    const motor = new NovelaMotor(mapa(), DEFS);
    const termina = (final: string): ITermina => ({
      recursoId: 't', escenaId: 'e', primerRecurso: false, ultimoRecurso: true, tipoRecurso: 'recurso_termina',
      final, mensaje: 'Fin',
    });

    it('un Termina es un recurso presentable', () => {
      const m = new NovelaMotor(mapa(termina('bueno')), DEFS);

      const r = m.resolver('t', m.estadoInicial());

      expect(r.recurso?.recursoId).toBe('t');
      expect(r.fin).toBeFalse();
    });

    it('registrarFinal anota el final una sola vez', () => {
      let e = motor.estadoInicial();
      e = motor.registrarFinal(termina('bueno'), e);
      e = motor.registrarFinal(termina('bueno'), e);
      e = motor.registrarFinal(termina('malo'), e);

      expect(e.finales).toEqual(['bueno', 'malo']);
    });

    it('un final que no está en el catálogo no se registra', () => {
      const e = motor.estadoInicial();

      expect(motor.registrarFinal(termina('fantasma'), e)).toBe(e);
    });

    it('registrar un final no modifica el estado anterior', () => {
      const e = motor.estadoInicial();
      motor.registrarFinal(termina('bueno'), e);

      expect(e.finales).toEqual([]);
    });

    it('resumenFinales cuenta los vistos del catálogo', () => {
      const e = { ...motor.estadoInicial(), finales: ['bueno', 'olvidado'] };

      expect(motor.resumenFinales(e)).toEqual({ descubiertos: 1, total: 2 });
      expect(motor.resumenFinales({ vars: {} })).toEqual({ descubiertos: 0, total: 2 });
    });

    it('finalDe devuelve el final del catálogo con su nombre', () => {
      expect(motor.finalDe(termina('malo'))?.nombre).toBe('Final malo');
      expect(motor.finalDe(termina('x'))).toBeUndefined();
    });

    it('logros() lista el catálogo con cuáles están desbloqueados', () => {
      const lista = motor.logros({ ...motor.estadoInicial(), logros: ['curioso'] });

      expect(lista.map(l => [l.id, l.desbloqueado])).toEqual([['valiente', false], ['curioso', true]]);
      expect(lista[0].nombre).toBe('Valiente');
      expect(motor.tieneLogros).toBeTrue();
      expect(new NovelaMotor(mapa(), { variables: [] }).tieneLogros).toBeFalse();
    });

    it('un logro desbloqueado por una opción se ve en el estado y se puede usar en condiciones', () => {
      const sel = selecciona('sel', [{ siguienteRecursoId: 'x', efectos: [{ logro: 'valiente' }] }]);
      const ev = evalua('ev', [{ condicion: { logro: 'valiente' }, siguienteRecursoId: 'orgullo' }], 'nada');
      const m = new NovelaMotor(mapa(ev, habla('orgullo'), habla('nada')), DEFS);

      const eleccion = m.elegirOpcion(sel, sel.opciones![0].recursoDecisionOpcionId, m.estadoInicial())!;

      expect(eleccion.estado.logros).toEqual(['valiente']);
      expect(m.resolver('ev', eleccion.estado).recurso?.recursoId).toBe('orgullo');
      expect(m.resolver('ev', m.estadoInicial()).recurso?.recursoId).toBe('nada');
    });
  });
});
