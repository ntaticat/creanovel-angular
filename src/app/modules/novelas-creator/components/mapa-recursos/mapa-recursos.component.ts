import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  instanceOfIConversacion,
  MixRecursosType,
  instanceOfIDecision,
} from '@models/recurso.interfaces';
import { of, Subject } from 'rxjs';
import { Data, DataSet, Edge, Network, Node, Options } from 'vis';

@Component({
  selector: 'app-mapa-recursos',
  templateUrl: './mapa-recursos.component.html',
  styleUrls: ['./mapa-recursos.component.scss'],
})
export class MapaRecursosComponent implements OnInit, OnChanges {
  @ViewChild('mapaRecursos', { static: true }) mapaRecursos!: ElementRef;
  @Input() recursos: MixRecursosType[] = [];
  @Input() escenaId: string = '';
  @Output() reloadRecursosEventEmiter = new EventEmitter<string>();
  @Output() onClickRecursoNode = new EventEmitter<string>();

  menuStatus: boolean = true;
  selectNode: any;
  prevSelectNode: any;

  data!: Data;
  nodes!: DataSet<Node>;
  edges!: DataSet<Edge>;
  selectedData: Subject<Data>;
  network!: Network;
  nodeNo: number = 6;

  constructor() {
    this.selectedData = new Subject<Data>();
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.setupMapaRecursos();
  }

  setupMapaRecursos() {
    this.nodes = this.getNodes();
    this.edges = this.getEdges();

    this.data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    this.network = new Network(
      this.mapaRecursos.nativeElement,
      this.data,
      this.getNetworkOptions()
    );

    this.network.on('select', params => this.onSelect2(params));
  }

  getNodes(): DataSet<Node> {
    let mapaRecursosNodos: Node[] = this.recursos.map(recurso => {
      let tipoRecurso = '';

      if (instanceOfIConversacion(recurso)) {
        tipoRecurso = 'CONVERSACION';
      }

      if (instanceOfIDecision(recurso)) {
        tipoRecurso = 'DECISION';
      }

      const mapaRecursosNodo: Node = {
        id: recurso.recursoId,
        label: tipoRecurso,
      };
      return mapaRecursosNodo;
    });
    const nodes: DataSet<Node> = new DataSet(mapaRecursosNodos);

    return nodes;
  }

  getEdges(): DataSet<Edge> {
    let mapaRecursosAristas: Edge[] = [];

    this.recursos.forEach(recurso => {
      if (instanceOfIConversacion(recurso)) {
        if (recurso.siguienteRecursoId === null) {
          return;
        }

        const mapaRecursosArista: Edge = {
          from: recurso.recursoId,
          to: recurso.siguienteRecursoId,
        };

        mapaRecursosAristas.push(mapaRecursosArista);
      }

      if (instanceOfIDecision(recurso)) {
        recurso.opciones?.forEach(decisionOpcion => {
          if (decisionOpcion.siguienteRecursoId === null) {
            return;
          }

          const mapaRecursosArista: Edge = {
            from: recurso.recursoId,
            to: decisionOpcion.siguienteRecursoId,
          };
          mapaRecursosAristas.push(mapaRecursosArista);
        });
      }
    });

    return new DataSet(mapaRecursosAristas);
  }

  getNetworkOptions(): Options {
    return {
      autoResize: true,
      height: '100%',
      width: '100%',
      physics: { enabled: false },
      layout: {
        randomSeed: undefined,
        improvedLayout: true,
        hierarchical: {
          enabled: true,
          levelSeparation: 170,
          direction: 'UD', // UD, DU, LR, RL
          sortMethod: 'directed', // hubsize, directed
          nodeSpacing: 100,
        },
      },
      nodes: {
        scaling: {
          min: 150,
          max: 160,
          label: {
            enabled: false,
            min: 14,
            max: 30,
            maxVisible: 40,
            drawThreshold: 5,
          },
          customScalingFunction: (
            min: number,
            max: number,
            total: number,
            value: number
          ) => {
            if (max === min) {
              return 0.5;
            } else {
              let scale = 1 / (max - min);
              return Math.max(0, (value - min) * scale);
            }
          },
        },
        size: 10,
        color: '#6296F0',

        font: {
          size: 20,
          color: '#ffffff',
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
