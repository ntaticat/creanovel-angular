/**
 * Disposición del mapa de recursos: un dibujo por niveles (de arriba abajo) que tolera enlaces hacia atrás.
 *
 * La historia puede volver a un nodo anterior (un bucle del día, reintentar un minijuego, volver al mapa de un Explora): el grafo
 * tiene ciclos. El layout jerárquico de vis-network los resuelve mal (dibuja el enlace de vuelta como una recta por detrás de los nodos
 * intermedios) y además bloquea el arrastre vertical, así que aquí se calcula la posición a mano y vis-network solo dibuja.
 *
 * Es TypeScript puro, sin Angular ni vis-network.
 */

export interface IAristaMapa {
  from: string;
  to: string;
}

export interface IPosicionMapa {
  x: number;
  y: number;
}

export interface IDisposicionMapa {
  posiciones: Map<string, IPosicionMapa>;
  /** Nivel de cada nodo (0 = arriba). Un enlace que no baja exactamente un nivel se dibuja curvo. */
  niveles: Map<string, number>;
}

export interface IOpcionesDisposicion {
  separacionNivel: number;
  separacionNodo: number;
}

export const SEPARACION_NIVEL = 170;
const OPCIONES: IOpcionesDisposicion = { separacionNivel: SEPARACION_NIVEL, separacionNodo: 260 };

/** Pasadas de reordenación por baricentro: pocas bastan para grafos de historias, que son casi árboles. */
const PASADAS = 4;

/**
 * Calcula el nivel y la posición de cada nodo.
 *
 * - `iniciales`: nodos por donde empieza la lectura (el "Inicio" de la escena); se recorren primero, así que quedan arriba.
 * - Los enlaces hacia atrás (los que cierran un ciclo al recorrer desde los iniciales) y los que apuntan a uno mismo no cuentan para
 *   los niveles: el resto forma un grafo sin ciclos y cada nodo queda por debajo de todos los que llegan a él.
 * - Los enlaces a nodos que no están en `ids` (otra escena) se ignoran.
 */
export function calcularDisposicion(
  ids: string[],
  aristas: IAristaMapa[],
  iniciales: string[] = [],
  opciones: Partial<IOpcionesDisposicion> = {}
): IDisposicionMapa {
  const { separacionNivel, separacionNodo } = { ...OPCIONES, ...opciones };
  const existentes = new Set(ids);

  // Sucesores únicos y en orden, sin bucles sobre sí mismo.
  const salidas = new Map<string, string[]>(ids.map(id => [id, []]));
  const conEntrada = new Set<string>();
  for (const { from, to } of aristas) {
    if (from === to || !existentes.has(from) || !existentes.has(to) || salidas.get(from)!.includes(to)) {
      continue;
    }
    salidas.get(from)!.push(to);
    conEntrada.add(to);
  }

  // Raíces: primero las indicadas, luego los que nadie apunta; lo que quede (ciclos sin entrada) se toma en el orden dado.
  const raices = [
    ...iniciales.filter(id => existentes.has(id)),
    ...ids.filter(id => !conEntrada.has(id)),
    ...ids,
  ];

  // Recorrido en profundidad iterativo (una historia larga no debe desbordar la pila): detecta los enlaces hacia atrás
  // y da un orden topológico (postorden invertido) del grafo sin ellos.
  const estado = new Map<string, 1 | 2>();   // 1 = en la pila, 2 = terminado
  const sucesores = new Map<string, string[]>(ids.map(id => [id, []]));
  const postorden: string[] = [];
  const descubrimiento: string[] = [];

  for (const raiz of raices) {
    if (estado.has(raiz)) {
      continue;
    }

    const pila: { id: string; siguiente: number }[] = [{ id: raiz, siguiente: 0 }];
    estado.set(raiz, 1);
    descubrimiento.push(raiz);

    while (pila.length) {
      const marco = pila[pila.length - 1];
      const destinos = salidas.get(marco.id)!;

      if (marco.siguiente >= destinos.length) {
        estado.set(marco.id, 2);
        postorden.push(marco.id);
        pila.pop();
        continue;
      }

      const destino = destinos[marco.siguiente++];

      if (estado.get(destino) === 1) {
        continue;   // enlace hacia atrás: cierra un ciclo, no cuenta
      }

      sucesores.get(marco.id)!.push(destino);

      if (!estado.has(destino)) {
        estado.set(destino, 1);
        descubrimiento.push(destino);
        pila.push({ id: destino, siguiente: 0 });
      }
    }
  }

  // Nivel = camino más largo desde una raíz: un nodo queda debajo de todos los que llegan a él.
  const niveles = new Map<string, number>(ids.map(id => [id, 0]));
  const predecesores = new Map<string, string[]>(ids.map(id => [id, []]));
  for (const id of [...postorden].reverse()) {
    for (const destino of sucesores.get(id)!) {
      niveles.set(destino, Math.max(niveles.get(destino)!, niveles.get(id)! + 1));
      predecesores.get(destino)!.push(id);
    }
  }

  // Orden dentro de cada nivel: el del descubrimiento, afinado por baricentro para reducir cruces.
  const porNivel: string[][] = [];
  for (const id of descubrimiento) {
    (porNivel[niveles.get(id)!] ??= []).push(id);
  }
  const rango = new Map<string, number>();
  const actualizarRangos = () => porNivel.forEach(nivel => nivel.forEach((id, i) => rango.set(id, i)));
  actualizarRangos();

  const reordenar = (nivel: string[], vecinos: Map<string, string[]>) => {
    const baricentro = new Map(
      nivel.map(id => {
        const v = vecinos.get(id)!;
        return [id, v.length ? v.reduce((suma, otro) => suma + rango.get(otro)!, 0) / v.length : rango.get(id)!] as const;
      })
    );
    // sort es estable: a igual baricentro se conserva el orden anterior.
    nivel.sort((a, b) => baricentro.get(a)! - baricentro.get(b)!);
    nivel.forEach((id, i) => rango.set(id, i));
  };

  for (let pasada = 0; pasada < PASADAS; pasada++) {
    for (let n = 1; n < porNivel.length; n++) reordenar(porNivel[n], predecesores);
    for (let n = porNivel.length - 2; n >= 0; n--) reordenar(porNivel[n], sucesores);
  }

  // Coordenadas: cada nodo intenta quedar bajo la media de los que llegan a él; dentro de un nivel se respeta el orden y la
  // separación mínima, y el nivel se recentra para repartir el desplazamiento.
  const posiciones = new Map<string, IPosicionMapa>();
  porNivel.forEach((nivel, n) => {
    const deseadas = nivel.map((id, i) => {
      const previos = predecesores.get(id)!.filter(p => posiciones.has(p));
      return previos.length
        ? previos.reduce((suma, p) => suma + posiciones.get(p)!.x, 0) / previos.length
        : (i - (nivel.length - 1) / 2) * separacionNodo;
    });

    const xs = [...deseadas];
    for (let i = 1; i < xs.length; i++) {
      xs[i] = Math.max(xs[i], xs[i - 1] + separacionNodo);
    }
    const desplazamiento = deseadas.reduce((suma, d, i) => suma + (d - xs[i]), 0) / (xs.length || 1);

    nivel.forEach((id, i) => posiciones.set(id, { x: xs[i] + desplazamiento, y: n * separacionNivel }));
  });

  return { posiciones, niveles };
}
