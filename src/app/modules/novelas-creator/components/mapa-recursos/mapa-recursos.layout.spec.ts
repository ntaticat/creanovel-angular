import { calcularDisposicion, IAristaMapa } from './mapa-recursos.layout';

const arista = (from: string, to: string): IAristaMapa => ({ from, to });
const cadena = (...ids: string[]) => ids.slice(1).map((id, i) => arista(ids[i], id));

describe('calcularDisposicion', () => {
  const SEP_NODO = 260;

  it('una cadena lineal baja un nivel por nodo, alineada', () => {
    const { niveles, posiciones } = calcularDisposicion(['a', 'b', 'c'], cadena('a', 'b', 'c'), ['a']);

    expect(['a', 'b', 'c'].map(id => niveles.get(id))).toEqual([0, 1, 2]);
    expect(['a', 'b', 'c'].map(id => posiciones.get(id)!.x)).toEqual([0, 0, 0]);
    expect(['a', 'b', 'c'].map(id => posiciones.get(id)!.y)).toEqual([0, 170, 340]);
  });

  it('un enlace al abuelo (hacia atrás) no altera los niveles de la cadena', () => {
    // a → b → c → d, y d vuelve a b: el caso que rompía el mapa
    const { niveles } = calcularDisposicion(
      ['a', 'b', 'c', 'd', 'e'],
      [...cadena('a', 'b', 'c', 'd'), arista('d', 'b'), arista('d', 'e')],
      ['a']
    );

    expect(['a', 'b', 'c', 'd', 'e'].map(id => niveles.get(id))).toEqual([0, 1, 2, 3, 4]);
  });

  it('un enlace al propio nodo se ignora (reintentar un minijuego)', () => {
    const { niveles } = calcularDisposicion(['a', 'b'], [arista('a', 'b'), arista('b', 'b')], ['a']);

    expect([niveles.get('a'), niveles.get('b')]).toEqual([0, 1]);
  });

  it('un ciclo sin entrada externa también se coloca, empezando por el primero de la lista', () => {
    const { niveles, posiciones } = calcularDisposicion(['a', 'b', 'c'], [arista('a', 'b'), arista('b', 'c'), arista('c', 'a')]);

    expect(['a', 'b', 'c'].map(id => niveles.get(id))).toEqual([0, 1, 2]);
    expect(posiciones.size).toBe(3);
  });

  it('el nodo de inicio queda arriba aunque haya otros sin entradas', () => {
    // x no recibe enlaces (huérfano) y aparece antes en la lista, pero el inicio es a
    const { niveles } = calcularDisposicion(['x', 'a', 'b'], [arista('a', 'b'), arista('b', 'a')], ['a']);

    expect(niveles.get('a')).toBe(0);
    expect(niveles.get('b')).toBe(1);
    expect(niveles.get('x')).toBe(0);
  });

  it('un nodo queda debajo de todos los que llegan a él (camino más largo), también con saltos', () => {
    // a → b → c y a → c: c va debajo de b, no al lado
    const { niveles } = calcularDisposicion(['a', 'b', 'c'], [arista('a', 'b'), arista('b', 'c'), arista('a', 'c')], ['a']);

    expect(niveles.get('c')).toBe(2);
  });

  it('los hermanos comparten nivel, se separan y quedan centrados bajo su padre', () => {
    const { posiciones } = calcularDisposicion(['p', 'x', 'y', 'z'], [arista('p', 'x'), arista('p', 'y'), arista('p', 'z')], ['p']);

    const xs = ['x', 'y', 'z'].map(id => posiciones.get(id)!.x);
    expect(new Set(['x', 'y', 'z'].map(id => posiciones.get(id)!.y)).size).toBe(1);
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(SEP_NODO);
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(SEP_NODO);
    expect((xs[0] + xs[2]) / 2).toBeCloseTo(posiciones.get('p')!.x, 5);
  });

  it('las ramas independientes no se solapan y una cadena bajo un hijo lo sigue', () => {
    // p → x → x2 → x3   y   p → y
    const { posiciones } = calcularDisposicion(
      ['p', 'x', 'y', 'x2', 'x3'],
      [arista('p', 'x'), arista('p', 'y'), arista('x', 'x2'), arista('x2', 'x3')],
      ['p']
    );

    expect(posiciones.get('x2')!.x).toBeCloseTo(posiciones.get('x')!.x, 5);
    expect(posiciones.get('x3')!.x).toBeCloseTo(posiciones.get('x')!.x, 5);
  });

  it('en ningún nivel dos nodos quedan más cerca que la separación mínima', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `n${i}`);
    const aristas: IAristaMapa[] = [];
    ids.forEach((id, i) => {
      if (i > 0) aristas.push(arista(ids[Math.floor((i - 1) / 2)], id));   // árbol binario
      if (i > 3 && i % 5 === 0) aristas.push(arista(id, ids[Math.floor(i / 4)]));   // algunos retornos
    });

    const { posiciones } = calcularDisposicion(ids, aristas, ['n0']);

    const porNivel = new Map<number, number[]>();
    posiciones.forEach(({ x, y }) => porNivel.set(y, [...(porNivel.get(y) ?? []), x]));
    porNivel.forEach(xs => {
      const ordenadas = [...xs].sort((a, b) => a - b);
      ordenadas.slice(1).forEach((x, i) => expect(x - ordenadas[i]).toBeGreaterThanOrEqual(SEP_NODO - 1e-6));
    });
  });

  it('ignora los enlaces a nodos de otra escena y los duplicados', () => {
    const { niveles } = calcularDisposicion(['a', 'b'], [arista('a', 'b'), arista('a', 'b'), arista('a', 'de-otra-escena'), arista('otra', 'a')], ['a']);

    expect([niveles.get('a'), niveles.get('b')]).toEqual([0, 1]);
    expect(niveles.has('de-otra-escena')).toBeFalse();
  });

  it('las componentes sin relación empiezan cada una arriba y no se pisan', () => {
    const { niveles, posiciones } = calcularDisposicion(['a', 'b', 'c', 'd'], [arista('a', 'b'), arista('c', 'd')], ['a']);

    expect(['a', 'b', 'c', 'd'].map(id => niveles.get(id))).toEqual([0, 1, 0, 1]);
    expect(Math.abs(posiciones.get('a')!.x - posiciones.get('c')!.x)).toBeGreaterThanOrEqual(SEP_NODO);
  });

  it('sin nodos devuelve una disposición vacía', () => {
    const { niveles, posiciones } = calcularDisposicion([], []);

    expect(niveles.size).toBe(0);
    expect(posiciones.size).toBe(0);
  });

  it('es determinista', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const aristas = [arista('a', 'b'), arista('a', 'c'), arista('b', 'd'), arista('c', 'd'), arista('d', 'a'), arista('d', 'e')];

    const uno = calcularDisposicion(ids, aristas, ['a']);
    const dos = calcularDisposicion(ids, aristas, ['a']);

    expect([...uno.posiciones]).toEqual([...dos.posiciones]);
  });

  it('una historia muy larga no desborda la pila', () => {
    const ids = Array.from({ length: 20000 }, (_, i) => `n${i}`);

    const { niveles } = calcularDisposicion(ids, [...cadena(...ids), arista('n19999', 'n0')], ['n0']);

    expect(niveles.get('n19999')).toBe(19999);
  });
});
