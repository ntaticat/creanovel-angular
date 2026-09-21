import { IMinijuegoReflejo } from '@models/motor.interfaces';
import { acertarReflejo, crearReflejo, fraccionRestanteReflejo, sanearReflejo, tickReflejo } from './reflejo';

describe('reflejo', () => {
  const config: IMinijuegoReflejo = { tipo: 'reflejo', objetivos: 4, aciertosNecesarios: 3, duracionMs: 1000 };
  const opciones = { factorTiempo: 1, aleatorio: () => 0.5 };
  const crear = (c = config, ahora = 0, o = opciones) => crearReflejo(c, ahora, o);

  it('crea un objetivo por cada uno pedido, dentro del área visible', () => {
    let n = 0;
    const estado = crear(config, 0, { factorTiempo: 1, aleatorio: () => (n++ % 2 ? 1 : 0) });

    expect(estado.objetivos.length).toBe(4);
    for (const o of estado.objetivos) {
      expect(o.x).toBeGreaterThanOrEqual(12);
      expect(o.x).toBeLessThanOrEqual(88);
      expect(o.y).toBeGreaterThanOrEqual(18);
      expect(o.y).toBeLessThanOrEqual(82);
    }
  });

  it('gana al acertar los necesarios, aunque se pierda alguno', () => {
    let e = crear();
    e = acertarReflejo(e, 100);
    e = acertarReflejo(e, 200);
    e = tickReflejo(e, 200 + 1000);          // se pierde el tercero
    expect(e.terminado).toBeFalse();
    e = acertarReflejo(e, 1300);              // acierta el cuarto: 3 de 4

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeTrue();
    expect(e.puntaje).toBe(3);
  });

  it('pierde en cuanto ya no se puede llegar a los aciertos necesarios', () => {
    let e = crear();
    e = tickReflejo(e, 1000);                 // se pierde el 1.º
    expect(e.terminado).toBeFalse();
    e = tickReflejo(e, 2000);                 // se pierde el 2.º: con 2 restantes ya no salen 3 aciertos

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeFalse();
    expect(e.puntaje).toBe(0);
  });

  it('un objetivo dura exactamente su duración; antes de eso sigue visible', () => {
    const e = crear();

    expect(tickReflejo(e, 999).indice).toBe(0);
    expect(tickReflejo(e, 1000).indice).toBe(1);
  });

  it('un reloj que llega tarde (pestaña dormida) pierde todos los objetivos que correspondan', () => {
    const e = tickReflejo(crear(), 10_000);

    expect(e.terminado).toBeTrue();
    expect(e.exito).toBeFalse();
    expect(e.aciertos).toBe(0);
  });

  it('el tiempo de cada objetivo cuenta desde que aparece, no desde el inicio', () => {
    let e = crear();
    e = acertarReflejo(e, 900);               // el 2.º aparece en 900
    expect(tickReflejo(e, 1800).indice).toBe(1);
    expect(tickReflejo(e, 1900).indice).toBe(2);
  });

  it('el factor de tiempo alarga cada objetivo', () => {
    const e = crear(config, 0, { factorTiempo: 2.5, aleatorio: () => 0.5 });

    expect(e.duracionMs).toBe(2500);
    expect(tickReflejo(e, 2400).indice).toBe(0);
  });

  it('ya terminado no cambia', () => {
    const fin = tickReflejo(crear(), 10_000);

    expect(acertarReflejo(fin, 0)).toBe(fin);
    expect(tickReflejo(fin, 99_999)).toBe(fin);
  });

  it('la fracción restante baja de 1 a 0 y no se sale del rango', () => {
    const e = crear();

    expect(fraccionRestanteReflejo(e, 0)).toBe(1);
    expect(fraccionRestanteReflejo(e, 250)).toBe(0.75);
    expect(fraccionRestanteReflejo(e, 5000)).toBe(0);
  });

  it('sanea una configuración fuera de límites', () => {
    expect(sanearReflejo({ tipo: 'reflejo', objetivos: 999, aciertosNecesarios: 999, duracionMs: 1 })).toEqual({
      tipo: 'reflejo', objetivos: 20, aciertosNecesarios: 20, duracionMs: 400,
    });
    expect(sanearReflejo({ tipo: 'reflejo' } as IMinijuegoReflejo).objetivos).toBe(3);
  });

  it('acertar todos es puntaje máximo', () => {
    let e = crear({ ...config, aciertosNecesarios: 4 });
    for (let i = 0; i < 4; i++) e = acertarReflejo(e, i * 10);

    expect(e.exito).toBeTrue();
    expect(e.puntaje).toBe(4);
  });
});
