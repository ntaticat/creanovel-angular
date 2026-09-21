import {
  Component,
  Input,
  OnChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IBackground } from '@models/background.interfaces';
import { IPersonaje } from '@models/personaje.interfaces';
import {
  IConversacion,
  IDecision,
  IEntrada,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
  instanceOfIAsigna,
  instanceOfIEvalua,
  instanceOfIExplora,
  instanceOfIJuega,
  instanceOfITermina,
  IExplora,
  MixRecursosType,
} from '@models/recurso.interfaces';
import {
  IRecursoArte,
  NovelaPlayerService,
} from 'src/app/shared/services/novela-player.service';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { nombreTipoRecurso, resumenRecurso } from 'src/app/shared/utils/recurso-etiqueta.util';
import { IOpcionJuego, IZonaJuego } from 'src/app/shared/engine/motor';
import { IDefiniciones } from '@models/motor.interfaces';
import { crearEstadoInicial } from 'src/app/shared/engine/estado';
import { interpolar } from 'src/app/shared/engine/interpolacion';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { NovelaStageComponent } from 'src/app/shared/components/novela-stage/novela-stage.component';

@Component({
  selector: 'app-recurso-preview',
  templateUrl: './recurso-preview.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NovelaStageComponent, EmptyStateComponent],
})
export class RecursoPreviewComponent implements OnChanges {
  @Input() recurso?: MixRecursosType;
  @Input() personajes: IPersonaje[] = [];
  @Input() backgrounds: IBackground[] = [];
  /** Con las definiciones, los textos con variables se ven con los valores iniciales de la partida. */
  @Input() definiciones: IDefiniciones | null | undefined;

  faEye = faEye;

  arte: IRecursoArte = {};
  /** Opciones y zonas se calculan al cambiar el recurso, no en un getter: un arreglo nuevo en cada ciclo dispara NG0100. */
  opciones: IOpcionJuego[] = [];
  zonas: IZonaJuego[] = [];

  constructor(private novelaPlayerService: NovelaPlayerService) {}

  ngOnChanges(): void {
    this.arte = this.recurso
      ? this.novelaPlayerService.resolverArte(
          this.recurso,
          this.personajes,
          this.backgrounds
        )
      : {};

    this.opciones =
      this.recurso && instanceOfIDecision(this.recurso)
        ? (this.recurso.opciones || []).map(o => ({
            id: o.recursoDecisionOpcionId,
            mensaje: this.texto(o.opcionMensaje),
            habilitada: true,
          }))
        : [];

    // El editor muestra todas las zonas (sin evaluar condiciones): no hay estado de juego que las decida.
    this.zonas =
      this.recurso && instanceOfIExplora(this.recurso)
        ? (this.recurso.opciones || [])
            .filter(o => o.tipo === 'zona' && !!o.region)
            .map(o => ({ id: o.recursoDecisionOpcionId, etiqueta: this.texto(o.opcionMensaje), region: o.region!, habilitada: true }))
        : [];
  }

  /** Un texto del autor tal como se leería al empezar la partida (con las variables en su valor inicial). */
  private texto(texto: string): string {
    const defs = this.definiciones ?? { variables: [] };
    return interpolar(texto, crearEstadoInicial(defs), defs);
  }

  get esExplora(): boolean {
    return !!this.recurso && instanceOfIExplora(this.recurso);
  }

  get esDecision(): boolean {
    return !!this.recurso && instanceOfIDecision(this.recurso);
  }

  get autor(): string {
    if (!this.recurso || this.arte.personajeNombre) {
      return '';
    }
    if (instanceOfIConversacion(this.recurso)) {
      return (this.recurso as IConversacion).autorMensaje || '';
    }
    if (instanceOfIDecision(this.recurso)) {
      return (this.recurso as IDecision).autorDecisionMensaje || '';
    }
    return '';
  }

  get mensaje(): string {
    return this.texto(this.mensajeCrudo());
  }

  private mensajeCrudo(): string {
    if (!this.recurso) {
      return '';
    }
    if (instanceOfIConversacion(this.recurso)) {
      return (this.recurso as IConversacion).mensaje;
    }
    if (instanceOfIDecision(this.recurso)) {
      return (this.recurso as IDecision).decisionMensaje;
    }
    if (instanceOfIEntrada(this.recurso)) {
      return (this.recurso as IEntrada).etiqueta;
    }
    if (instanceOfIExplora(this.recurso)) {
      return (this.recurso as IExplora).mensaje || '';
    }
    return '';
  }

  /** Evalúa y Asigna no se muestran al jugador y Juega es un minijuego: no hay escenario que previsualizar, solo su regla. */
  get esAutomatico(): boolean {
    return (
      !!this.recurso &&
      (instanceOfIEvalua(this.recurso) || instanceOfIAsigna(this.recurso) || instanceOfIJuega(this.recurso) || instanceOfITermina(this.recurso))
    );
  }

  get subtituloAutomatico(): string {
    if (this.recurso && instanceOfITermina(this.recurso)) return 'final de la historia';
    return this.recurso && instanceOfIJuega(this.recurso) ? 'minijuego (se juega en la vista previa del borrador)' : 'nodo automático';
  }

  get tipoAutomatico(): string {
    return this.recurso ? nombreTipoRecurso(this.recurso) : '';
  }

  get resumenAutomatico(): string {
    return this.recurso ? resumenRecurso(this.recurso) : '';
  }

  get esEntrada(): boolean {
    return !!this.recurso && instanceOfIEntrada(this.recurso);
  }

  get placeholderEntrada(): string {
    return this.esEntrada ? (this.recurso as IEntrada).placeholder : '';
  }
}
