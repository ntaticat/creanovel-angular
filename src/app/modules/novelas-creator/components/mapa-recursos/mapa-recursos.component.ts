import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  instanceOfIConversacion,
  MixRecursosType,
  instanceOfIDecision,
  instanceOfIEntrada,
  instanceOfIEvalua,
  instanceOfIAsigna,
  instanceOfIExplora,
  instanceOfIJuega,
  instanceOfITermina,
} from '@models/recurso.interfaces';
import { describirMinijuego } from 'src/app/shared/engine/minijuegos/minijuego';
import { describirCondicion, describirEfectos } from 'src/app/shared/engine/texto';
import { Subject } from 'rxjs';
import { Data, Edge, Network, Node, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faExpand, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { calcularDisposicion, IDisposicionMapa, IPosicionMapa, SEPARACION_NIVEL } from './mapa-recursos.layout';

interface IMapaColores {
  background: string;
  hover: string;
  border: string;
}

// Same hues as tailwind.config.js (primary = indigo, warning = amber,
// success = emerald) so the graph reads as part of the design system.
const MAPA_RECURSOS_COLORS = {
  conversacion: { background: '#eef2ff', hover: '#e0e7ff', border: '#4f46e5' },
  decision: { background: '#fffbeb', hover: '#fef3c7', border: '#d97706' },
  entrada: { background: '#ecfdf5', hover: '#d1fae5', border: '#059669' },
  evalua: { background: '#f5f3ff', hover: '#ede9fe', border: '#7c3aed' },
  asigna: { background: '#ecfeff', hover: '#cffafe', border: '#0891b2' },
  explora: { background: '#fff1f2', hover: '#ffe4e6', border: '#e11d48' },
  juega: { background: '#fdf4ff', hover: '#fae8ff', border: '#c026d3' },
  termina: { background: '#f3f4f6', hover: '#e5e7eb', border: '#374151' },
  text: '#1f2937',
  muted: '#6b7280',
  edge: '#9ca3af',
  edgeActive: '#4f46e5',
  halo: '#f9fafb',
};

const MAPA_RECURSOS_FONT = 'Inter, sans-serif';
const MAX_CARACTERES_NODO = 70;
const MAX_CARACTERES_ARISTA = 24;
/** Desplazamiento (en píxeles del lienzo, el doble de lo que se abre la curva) de los enlaces que retroceden o se saltan niveles. */
const ABERTURA_CURVA = 300;

interface IEnlaceMapa {
  from: string;
  to: string;
  extra: Partial<Edge>;
}

interface IRecursoDescripcion {
  tipo: string;
  colores: IMapaColores;
  autor: string;
  texto: string;
  opciones: string[];
}

@Component({
  selector: 'app-mapa-recursos',
  templateUrl: './mapa-recursos.component.html',
  styleUrls: ['./mapa-recursos.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent],
})
export class MapaRecursosComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('mapaRecursos', { static: true }) mapaRecursos!: ElementRef;
  @Input() recursos: MixRecursosType[] = [];
  @Input() escenaId: string = '';
  @Output() reloadRecursosEventEmiter = new EventEmitter<string>();
  @Output() onClickRecursoNode = new EventEmitter<string>();

  faExpand = faExpand;
  faReordenar = faWandMagicSparkles;

  leyenda = [
    { etiqueta: 'Habla', colores: MAPA_RECURSOS_COLORS.conversacion },
    { etiqueta: 'Selecciona', colores: MAPA_RECURSOS_COLORS.decision },
    { etiqueta: 'Evalúa', colores: MAPA_RECURSOS_COLORS.evalua },
    { etiqueta: 'Asigna', colores: MAPA_RECURSOS_COLORS.asigna },
    { etiqueta: 'Pide', colores: MAPA_RECURSOS_COLORS.entrada },
    { etiqueta: 'Explora', colores: MAPA_RECURSOS_COLORS.explora },
    { etiqueta: 'Juega', colores: MAPA_RECURSOS_COLORS.juega },
    { etiqueta: 'Termina', colores: MAPA_RECURSOS_COLORS.termina },
  ];

  menuStatus: boolean = true;
  selectNode: any;
  prevSelectNode: any;

  data!: Data;
  nodes!: DataSet<Node>;
  edges!: DataSet<Edge>;
  selectedData: Subject<Data>;
  network!: Network;
  nodeNo: number = 6;

  /** Nivel y posición calculados para los recursos actuales (ver `mapa-recursos.layout.ts`). */
  private disposicion: IDisposicionMapa = { posiciones: new Map(), niveles: new Map() };
  /**
   * Lo que el autor movió a mano. El mapa se vuelve a dibujar cada vez que cambian los recursos (al guardar un nodo, por ejemplo):
   * sin recordarlo, cada edición devolvería todo a su sitio. Vive solo mientras el componente; "Reordenar" lo borra.
   */
  private posicionesManuales = new Map<string, IPosicionMapa>();
  private posicionesAlArrastrar = new Map<string, IPosicionMapa>();

  constructor() {
    this.selectedData = new Subject<Data>();
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.setupMapaRecursos();
  }

  ngOnDestroy(): void {
    this.network?.destroy();
  }

  ajustarVista(): void {
    this.network?.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
  }

  /** Descarta las posiciones movidas a mano y vuelve a la disposición automática. */
  reordenar(): void {
    this.posicionesManuales.clear();
    this.setupMapaRecursos();
  }

  setupMapaRecursos() {
    // A new Network is built on every input change; destroy the previous one
    // so its canvas, listeners and resize observers do not pile up.
    this.network?.destroy();

    // La disposición depende de los enlaces, y cómo se dibuja cada enlace (recto o curvo) depende de la disposición.
    const enlaces = this.recolectarAristas();
    this.disposicion = calcularDisposicion(
      this.recursos.map(recurso => recurso.recursoId),
      enlaces,
      this.recursos.filter(recurso => recurso.primerRecurso).map(recurso => recurso.recursoId)
    );

    this.nodes = this.getNodes();
    this.edges = this.getEdges(enlaces);

    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    const contenedor: HTMLElement = this.mapaRecursos.nativeElement;
    this.network = new Network(contenedor, this.data, this.getNetworkOptions());

    // "click" (not "select"): vis-network only fires "select" when the
    // selection changes, so re-clicking a node that stayed selected after the
    // modal was closed would emit nothing.
    this.network.on('click', params => this.onSelect2(params));
    this.network.on('hoverNode', () => (contenedor.style.cursor = 'pointer'));
    this.network.on('blurNode', () => (contenedor.style.cursor = 'default'));

    // Los nodos se mueven libremente; lo que el autor deja en otro sitio se recuerda al redibujar.
    this.network.on('dragStart', params => {
      this.posicionesAlArrastrar = new Map(
        Object.entries(this.network.getPositions(params.nodes as string[]))
      );
    });
    this.network.on('dragEnd', params => {
      for (const [id, posicion] of Object.entries(this.network.getPositions(params.nodes as string[]))) {
        const antes = this.posicionesAlArrastrar.get(id);
        // Un simple clic también termina un "arrastre": solo cuenta si el nodo se movió de verdad.
        if (!antes || Math.hypot(posicion.x - antes.x, posicion.y - antes.y) > 3) {
          this.posicionesManuales.set(id, { x: posicion.x, y: posicion.y });
        }
      }
    });

    this.network.fit();
  }

  private describirRecurso(recurso: MixRecursosType): IRecursoDescripcion {
    if (instanceOfIConversacion(recurso)) {
      return {
        tipo: 'Habla',
        colores: MAPA_RECURSOS_COLORS.conversacion,
        autor: recurso.autorMensaje || '',
        texto: recurso.mensaje || '',
        opciones: [],
      };
    }

    if (instanceOfIDecision(recurso)) {
      return {
        tipo: 'Selecciona',
        colores: MAPA_RECURSOS_COLORS.decision,
        autor: recurso.autorDecisionMensaje || '',
        texto: recurso.decisionMensaje || '',
        opciones: (recurso.opciones || []).map(o => o.opcionMensaje),
      };
    }

    if (instanceOfIEvalua(recurso)) {
      const ramas = (recurso.opciones || []).filter(o => o.tipo === 'rama');
      return {
        tipo: 'Evalúa',
        colores: MAPA_RECURSOS_COLORS.evalua,
        autor: '',
        texto: `${ramas.length} rama${ramas.length === 1 ? '' : 's'} y sino`,
        opciones: ramas.map(r => `si ${describirCondicion(r.condicion)}`),
      };
    }

    if (instanceOfITermina(recurso)) {
      return {
        tipo: 'Termina',
        colores: MAPA_RECURSOS_COLORS.termina,
        autor: '',
        texto: `Final: ${recurso.final || '(sin elegir)'}`,
        opciones: recurso.mensaje ? [recurso.mensaje] : [],
      };
    }

    if (instanceOfIJuega(recurso)) {
      return {
        tipo: 'Juega',
        colores: MAPA_RECURSOS_COLORS.juega,
        autor: '',
        texto: recurso.mensaje || describirMinijuego(recurso.minijuego),
        opciones: [describirMinijuego(recurso.minijuego)],
      };
    }

    if (instanceOfIExplora(recurso)) {
      const zonas = (recurso.opciones || []).filter(o => o.tipo === 'zona');
      return {
        tipo: 'Explora',
        colores: MAPA_RECURSOS_COLORS.explora,
        autor: '',
        texto: recurso.mensaje || `${zonas.length} zona${zonas.length === 1 ? '' : 's'}`,
        opciones: zonas.map(z => z.opcionMensaje),
      };
    }

    if (instanceOfIAsigna(recurso)) {
      return {
        tipo: 'Asigna',
        colores: MAPA_RECURSOS_COLORS.asigna,
        autor: '',
        texto: describirEfectos(recurso.efectos),
        opciones: [],
      };
    }

    return {
      tipo: instanceOfIEntrada(recurso) ? 'Pide' : 'Recurso',
      colores: MAPA_RECURSOS_COLORS.entrada,
      autor: '',
      texto: instanceOfIEntrada(recurso) ? recurso.etiqueta || '' : '',
      opciones: [],
    };
  }

  private acortar(texto: string, max: number): string {
    const limpio = texto.replace(/\s+/g, ' ').trim();
    return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
  }

  // Node labels use vis-network's "html" markup, where "<" and "&" are
  // significant; user text has to be escaped before it goes into the label.
  private escaparMarkup(texto: string): string {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  getNodes(): DataSet<Node> {
    const mapaRecursosNodos: Node[] = this.recursos.map(recurso => {
      const { tipo, colores, autor, texto, opciones } =
        this.describirRecurso(recurso);

      const marcas = [
        recurso.primerRecurso ? 'Inicio' : '',
        recurso.ultimoRecurso ? 'Fin' : '',
      ].filter(Boolean);
      const encabezado = [tipo, ...marcas].join(' · ');

      const lineas = [`<b>${this.escaparMarkup(encabezado)}</b>`];
      if (autor) {
        lineas.push(`<i>${this.escaparMarkup(this.acortar(autor, 30))}</i>`);
      }
      lineas.push(
        this.escaparMarkup(this.acortar(texto, MAX_CARACTERES_NODO)) ||
          '<i>(sin mensaje)</i>'
      );

      // The tooltip is plain text (vis-network sets it via innerText), so it
      // needs no escaping and can show the full, untruncated content.
      const tooltip = [
        [encabezado, autor].filter(Boolean).join(' — '),
        texto,
        ...opciones.map((o, i) => `${i + 1}. ${o}`),
      ]
        .filter(Boolean)
        .join('\n');

      const posicion =
        this.posicionesManuales.get(recurso.recursoId) ??
        this.disposicion.posiciones.get(recurso.recursoId);

      const mapaRecursosNodo: Node = {
        id: recurso.recursoId,
        x: posicion?.x,
        y: posicion?.y,
        label: lineas.join('\n'),
        title: tooltip,
        color: {
          background: colores.background,
          border: colores.border,
          highlight: { background: colores.hover, border: colores.border },
          hover: { background: colores.hover, border: colores.border },
        },
      };
      return mapaRecursosNodo;
    });

    return new DataSet(mapaRecursosNodos);
  }

  /** Cómo se dibuja un enlace según los niveles que salva: el de siempre baja un nivel; los demás se curvan para no pasar por detrás de otros nodos. */
  private suavizado(salto: number, paralela: number): Edge['smooth'] | undefined {
    const retrocede = salto <= 0;
    const saltaNiveles = salto > 1;

    if (!retrocede && !saltaNiveles && paralela === 0) {
      return undefined;
    }

    // La curva se abre unos 150 px a un lado, sea cual sea la distancia, para librar la columna de nodos (y dejar ver su etiqueta).
    // vis-network mide la curvatura como fracción de la distancia entre los extremos.
    const distancia = Math.max(1, Math.abs(salto)) * SEPARACION_NIVEL;
    const base = retrocede || saltaNiveles ? Math.max(0.3, ABERTURA_CURVA / distancia) : 0;
    // Un enlace que vuelve arriba se curva hacia un lado y uno que se salta niveles hacia el otro, así no se pisan entre sí.
    const sentido = retrocede ? 0 : 1;
    return {
      enabled: true,
      type: (paralela + sentido) % 2 ? 'curvedCCW' : 'curvedCW',
      roundness: Math.min(1, base + 0.35 * Math.ceil(paralela / 2)),
    };
  }

  getEdges(enlaces: IEnlaceMapa[] = this.recolectarAristas()): DataSet<Edge> {
    // Varias salidas de un mismo nodo hacia el mismo destino (dos opciones que llevan a un Evalúa,
    // por ejemplo) se dibujarían una encima de otra: a partir de la segunda se curvan.
    const paralelas = new Map<string, number>();
    const aristas: Edge[] = enlaces.map(({ from, to, extra }) => {
      const clave = `${from}>${to}`;
      const n = paralelas.get(clave) ?? 0;
      paralelas.set(clave, n + 1);
      const salto = (this.disposicion.niveles.get(to) ?? 0) - (this.disposicion.niveles.get(from) ?? 0);
      // Un enlace de un nodo a sí mismo (reintentar un minijuego) lo dibuja vis-network como un bucle.
      const smooth = from === to ? undefined : this.suavizado(salto, n);
      return { from, to, ...(smooth ? { smooth } : {}), ...extra };
    });

    return new DataSet(aristas);
  }

  /** Todos los enlaces entre recursos de esta escena, con lo que se dibuja en cada uno (etiqueta, tooltip...). */
  private recolectarAristas(): IEnlaceMapa[] {
    // Un recurso puede apuntar (como "siguiente") a otro recurso de una escena
    // distinta a la que se está viendo (transición entre escenas). Esta vista
    // solo dibuja nodos de la escena actual, así que cualquier arista hacia un
    // recursoId fuera de ese conjunto se omite: vis-network lanza un error si
    // una arista referencia un nodo inexistente, lo que rompía el mapa entero.
    const nodeIds = new Set(this.recursos.map(recurso => recurso.recursoId));
    const enlaces: IEnlaceMapa[] = [];

    const agregar = (
      from: string,
      to: string | undefined,
      extra: Partial<Edge> = {}
    ) => {
      if (!to || !nodeIds.has(to)) {
        return;
      }
      enlaces.push({ from, to, extra });
    };

    this.recursos.forEach(recurso => {
      // Habla, Pide y Asigna continúan por un único "siguiente".
      if (
        instanceOfIConversacion(recurso) ||
        instanceOfIEntrada(recurso) ||
        instanceOfIAsigna(recurso)
      ) {
        agregar(recurso.recursoId, recurso.siguienteRecursoId);
      }

      if (instanceOfIDecision(recurso)) {
        recurso.opciones?.forEach(decisionOpcion => {
          const condicional = !!decisionOpcion.condicion;
          const mensaje = decisionOpcion.opcionMensaje || '';
          // Each option is its own edge, labelled with what the reader picks;
          // una opción con condición lleva ⚑ y su condición en el tooltip.
          agregar(recurso.recursoId, decisionOpcion.siguienteRecursoId, {
            label:
              this.acortar(mensaje, MAX_CARACTERES_ARISTA) +
              (condicional ? ' ⚑' : ''),
            title: condicional
              ? `${mensaje}\nSolo si ${describirCondicion(decisionOpcion.condicion)}`
              : mensaje,
          });
        });
      }

      if (instanceOfIJuega(recurso)) {
        // Las dos salidas del minijuego; el fallo va punteado, como el "sino" de un Evalúa.
        (recurso.opciones || []).forEach(salida => {
          const exito = salida.tipo === 'exito';
          agregar(recurso.recursoId, salida.siguienteRecursoId, {
            label: exito ? '✔ éxito' : '✘ fallo',
            title: exito ? 'Si sale bien' : 'Si sale mal',
            dashes: !exito,
          });
        });
      }

      if (instanceOfIExplora(recurso)) {
        // Cada zona es una salida: se rotula con su nombre; ⚑ si solo aparece bajo una condición.
        (recurso.opciones || [])
          .filter(o => o.tipo === 'zona')
          .forEach(zona => {
            const condicional = !!zona.condicion;
            agregar(recurso.recursoId, zona.siguienteRecursoId, {
              label: this.acortar(zona.opcionMensaje || '', MAX_CARACTERES_ARISTA) + (condicional ? ' ⚑' : ''),
              title: condicional
                ? `${zona.opcionMensaje}\nSolo si ${describirCondicion(zona.condicion)}`
                : zona.opcionMensaje,
            });
          });
      }

      if (instanceOfIEvalua(recurso)) {
        (recurso.opciones || [])
          .filter(o => o.tipo === 'rama')
          .forEach(rama => {
            const condicion = describirCondicion(rama.condicion);
            agregar(recurso.recursoId, rama.siguienteRecursoId, {
              label: this.acortar(`si ${condicion}`, MAX_CARACTERES_ARISTA),
              title: `Si ${condicion}`,
            });
          });
        // El "sino" va punteado para distinguirlo de las ramas con condición.
        agregar(recurso.recursoId, recurso.siguienteRecursoId, {
          label: 'sino',
          dashes: true,
        });
      }
    });

    return enlaces;
  }

  getNetworkOptions(): Options {
    return {
      autoResize: true,
      height: '100%',
      width: '100%',
      physics: { enabled: false },
      interaction: {
        hover: true,
        tooltipDelay: 250,
        zoomView: true,
        dragView: true,
      },
      // La disposición la calcula `calcularDisposicion`: el layout jerárquico de vis-network dibuja mal los enlaces hacia atrás
      // y no deja mover los nodos en vertical.
      layout: { hierarchical: false },
      nodes: {
        shape: 'box',
        margin: { top: 10, right: 14, bottom: 10, left: 14 },
        borderWidth: 2,
        borderWidthSelected: 4,
        widthConstraint: { minimum: 150, maximum: 220 },
        shapeProperties: { borderRadius: 10 },
        shadow: {
          enabled: true,
          color: 'rgba(17, 24, 39, 0.15)',
          size: 8,
          x: 0,
          y: 2,
        },
        font: {
          multi: 'html',
          face: MAPA_RECURSOS_FONT,
          size: 14,
          color: MAPA_RECURSOS_COLORS.text,
          align: 'left',
          bold: {
            face: MAPA_RECURSOS_FONT,
            size: 12,
            color: MAPA_RECURSOS_COLORS.muted,
            mod: 'bold',
          },
          ital: {
            face: MAPA_RECURSOS_FONT,
            size: 13,
            color: MAPA_RECURSOS_COLORS.text,
            mod: 'italic',
          },
        },
      },
      edges: {
        width: 2,
        selectionWidth: 1,
        hoverWidth: 1,
        arrows: { to: { enabled: true, scaleFactor: 0.7 } },
        color: {
          color: MAPA_RECURSOS_COLORS.edge,
          highlight: MAPA_RECURSOS_COLORS.edgeActive,
          hover: MAPA_RECURSOS_COLORS.edgeActive,
        },
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 0.5,
        },
        font: {
          face: MAPA_RECURSOS_FONT,
          size: 12,
          color: MAPA_RECURSOS_COLORS.muted,
          strokeWidth: 5,
          strokeColor: MAPA_RECURSOS_COLORS.halo,
          align: 'middle',
        },
      },
    };
  }

  private onSelect(params: INetworkOnSelectParams): void {
    if (params.nodes.length == 1) {
      this.nodes.add({
        id: this.nodeNo,
        label: `Node ${this.nodeNo}`,
      });
      this.edges.add({
        from: params.nodes[0],
        to: this.nodeNo,
      });
      this.nodeNo++;
      const result = {
        edges: params.edges,
        nodes: params.nodes,
        pointer: params.pointer,
      };
      if (this.selectNode) {
        this.prevSelectNode = this.selectNode;
      }
      this.selectNode = result;

      const newEdges = this.edges
        .get()
        .filter(value => {
          return this.network
            .getSelectedEdges()
            .some(val => val == value['id']);
        })
        .map(value => {
          return { to: value['to'], from: value['from'] };
        });

      const rootSelected: number = <number>this.network.getSelectedNodes()[0];

      let newNodes = this.nodes.get().filter(value => {
        return newEdges.some(s => s.to == value.id);
      });

      if (!newNodes.some(value => value.id == rootSelected)) {
        const self = this.nodes.get().find(val => val.id == rootSelected)!;
        newNodes.unshift(self);
      } else {
        const root = this.nodes.get()[0];
        newNodes.unshift(root);
      }
      this.selectedData.next({ edges: newEdges, nodes: newNodes });
    }
  }

  onSelect2(params: INetworkOnSelectParams): void {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];

      this.onClickRecursoNode.emit(nodeId);
    }
  }
}

export interface INetworkOnSelectParams {
  edges: string[];
  events: object;
  nodes: string[];
  pointer: {
    DOM: {
      x: number;
      y: number;
    };
    canvas: {
      x: number;
      y: number;
    };
  };
}
