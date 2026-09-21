import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IEscena } from '@models/escena.interfaces';
import {
  instanceOfIConversacion,
  instanceOfIDecision,
  MixRecursosType,
} from '@models/recurso.interfaces';
import { NovelasService } from '@services/novelas.service';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { EscenasService } from '@services/escenas.service';
import { RecursosService } from '@services/recursos.service';
import { ModalActionsComponent } from '../components/modal-actions/modal-actions.component';
import { RecursoPreviewComponent } from '../components/recurso-preview/recurso-preview.component';
import { EscenaCreatorFormComponent } from '../components/escena-creator-form/escena-creator-form.component';
import { RecursoCreatorFormComponent } from '../components/recurso-creator-form/recurso-creator-form.component';
import { PersonajeCreatorFormComponent } from '../components/personaje-creator-form/personaje-creator-form.component';
import { FondoCreatorFormComponent } from '../components/fondo-creator-form/fondo-creator-form.component';
import { MapaRecursosComponent } from '../components/mapa-recursos/mapa-recursos.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faUserGroup,
  faPlus,
  faEye,
  faPen,
  faTrash,
  faLayerGroup,
  faDiagramProject,
  faSliders,
  faClipboardCheck,
  faTags,
  faObjectGroup,
  faXmark,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { DefinicionesEditorComponent } from '../components/definiciones-editor/definiciones-editor.component';
import { ValidacionIssuesComponent } from '../components/validacion-issues/validacion-issues.component';
import { IDefiniciones, IValidacionVersion } from '@models/motor.interfaces';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import {
  agruparPorEtiqueta,
  alternarSeleccion,
  depurarSeleccion,
  etiquetasDe,
  filtrarPorEtiquetas,
  IGrupoEscenas,
} from '../components/etiquetas-input/escenas-etiquetas';

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ModalActionsComponent,
    RecursoPreviewComponent,
    EscenaCreatorFormComponent,
    RecursoCreatorFormComponent,
    PersonajeCreatorFormComponent,
    FondoCreatorFormComponent,
    RouterLink,
    MapaRecursosComponent,
    FaIconComponent,
    EmptyStateComponent,
    DefinicionesEditorComponent,
    ValidacionIssuesComponent,
    SpinnerComponent,
    NgTemplateOutlet,
  ],
})
export class NovelaCreatorPageComponent implements OnInit {
  instanceOfIConversacion = instanceOfIConversacion;
  instanceOfIDecision = instanceOfIDecision;

  faArrowLeft = faArrowLeft;
  faUserGroup = faUserGroup;
  faImage = faImage;
  faEye = faEye;
  faPlus = faPlus;
  faPen = faPen;
  faTrash = faTrash;
  faLayerGroup = faLayerGroup;
  faDiagramProject = faDiagramProject;
  faSliders = faSliders;
  faClipboardCheck = faClipboardCheck;
  faTags = faTags;
  faObjectGroup = faObjectGroup;
  faXmark = faXmark;

  novelaVersionId: string = '';
  novelaInfo?: INovelaVersion;
  novela?: INovela;
  escenaInfo?: IEscena;

  showModalActions: boolean = false;
  showModalRecursoInfo: boolean = false;
  showModalRecursoDelete: boolean = false;
  showModalEscena: boolean = false;
  showModalEscenaEditar: boolean = false;
  showModalRecursoForm: boolean = false;
  showModalAssets: boolean = false;
  pestanaAssets: 'personajes' | 'fondos' = 'personajes';
  showModalVariables: boolean = false;
  showModalValidacion: boolean = false;

  validacion?: IValidacionVersion;
  validando: boolean = false;

  /** Etiquetas de todas las escenas de la versión, para el filtro y las sugerencias del formulario. */
  etiquetasDisponibles: string[] = [];
  /** Las etiquetas que el autor eligió para filtrar la lista de escenas (la unión de sus grupos). */
  etiquetasSeleccionadas: string[] = [];
  agruparPorEtiquetas: boolean = false;
  /** Lo que muestra la lista de escenas: las visibles, y esas mismas repartidas por etiqueta si se agrupa. */
  escenasVisibles: IEscena[] = [];
  gruposEscenas: IGrupoEscenas<IEscena>[] = [];

  recursoEditar?: MixRecursosType;
  recursoPreview?: MixRecursosType;
  selectedNodeRecursoId: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private novelasService: NovelasService,
    private novelasVersionesService: NovelasVersionesService,
    private escenasService: EscenasService,
    private recursosService: RecursosService
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaVersionId = params['novelaVersionId'];
    });
  }

  ngOnInit(): void {
    this.cargarVersion();
  }

  cargarVersion(): void {
    this.novelasVersionesService
      .getNovelaVersion(this.novelaVersionId)
      .subscribe(novelaVersion => {
        this.novelaInfo = novelaVersion;
        this.recalcularListaEscenas();

        if (this.escenaInfo) {
          const escenaActualizada = novelaVersion.escenas?.find(
            e => e.escenaId === this.escenaInfo?.escenaId
          );
          this.escenaInfo = escenaActualizada;
        }

        this.novelasService
          .getNovela(novelaVersion.novelaId, 'False', 'True', 'True')
          .subscribe(novela => {
            this.novela = novela;
          });
      });
  }

  onEscenaCreada(): void {
    this.showSpecificModalAction();
    this.cargarVersion();
  }

  onEscenaEditada(): void {
    this.showSpecificModalAction();
    this.cargarVersion();
  }

  onToggleEtiqueta(etiqueta: string): void {
    this.etiquetasSeleccionadas = alternarSeleccion(this.etiquetasSeleccionadas, etiqueta);
    this.recalcularListaEscenas();
  }

  onLimpiarEtiquetas(): void {
    this.etiquetasSeleccionadas = [];
    this.recalcularListaEscenas();
  }

  onToggleAgrupar(): void {
    this.agruparPorEtiquetas = !this.agruparPorEtiquetas;
    this.recalcularListaEscenas();
  }

  etiquetaSeleccionada(etiqueta: string): boolean {
    return this.etiquetasSeleccionadas.some(s => s.toLowerCase() === etiqueta.toLowerCase());
  }

  private recalcularListaEscenas(): void {
    const escenas = this.novelaInfo?.escenas ?? [];
    this.etiquetasDisponibles = etiquetasDe(escenas);
    this.etiquetasSeleccionadas = depurarSeleccion(this.etiquetasSeleccionadas, this.etiquetasDisponibles);
    this.escenasVisibles = filtrarPorEtiquetas(escenas, this.etiquetasSeleccionadas);
    this.gruposEscenas = this.agruparPorEtiquetas
      ? agruparPorEtiqueta(this.escenasVisibles, this.etiquetasSeleccionadas)
      : [];
  }

  onClickEscena(escenaId: string) {
    this.escenasService.getEscena(escenaId).subscribe(escena => {
      this.escenaInfo = escena;
    });
  }

  escenaButtonClass(escenaId: string): string {
    const base =
      'shrink-0 whitespace-nowrap md:whitespace-normal text-left md:w-full px-3 py-2 rounded-lg text-sm transition-colors';
    return escenaId === this.escenaInfo?.escenaId
      ? `${base} bg-primary-50 text-primary-700 font-medium`
      : `${base} text-gray-600 hover:bg-gray-100`;
  }

  etiquetaChipClass(etiqueta: string): string {
    const base =
      'shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';
    return this.etiquetaSeleccionada(etiqueta)
      ? `${base} border-primary-600 bg-primary-600 text-white`
      : `${base} border-gray-300 bg-white text-gray-600 hover:bg-gray-100`;
  }

  onClickAgregarRecurso() {
    this.recursoEditar = undefined;
    this.showSpecificModalAction('RECURSO_FORM');
  }

  onClickEditarRecurso() {
    this.recursoEditar = this.escenaInfo?.recursos.find(
      r => r.recursoId === this.selectedNodeRecursoId
    );
    this.showSpecificModalAction('RECURSO_FORM');
  }

  onRecursoGuardado() {
    this.showSpecificModalAction();
    this.onClickCloseModalActions();
    this.cargarVersion();
    if (this.escenaInfo) {
      this.onClickEscena(this.escenaInfo.escenaId);
    }
  }

  onSelectNodeShowModalActions(recursoId: string) {
    this.selectedNodeRecursoId = recursoId;
    this.recursoPreview = this.escenaInfo?.recursos.find(
      r => r.recursoId === recursoId
    );
    this.showModalActions = true;
    this.showSpecificModalAction('INFO');
  }

  onClickCloseModalActions() {
    this.showModalActions = false;
    this.selectedNodeRecursoId = '';
  }

  onClickShowDeleteModal() {
    this.showSpecificModalAction('DELETE');
  }

  onClickDeleteRecurso() {
    this.deleteRecurso(this.selectedNodeRecursoId);
  }

  deleteRecurso(recursoId: string) {
    this.recursosService.deleteRecurso(recursoId).subscribe(() => {
      this.onClickCloseModalActions();
      this.showModalRecursoDelete = false;
      if (this.escenaInfo) {
        this.onClickEscena(this.escenaInfo.escenaId);
      }
    });
  }

  onAssetAsociado() {
    this.cargarVersion();
  }

  onClickVariables() {
    this.showSpecificModalAction('VARIABLES');
  }

  onDefinicionesGuardadas(definiciones: IDefiniciones) {
    if (this.novelaInfo) {
      this.novelaInfo = { ...this.novelaInfo, definiciones };
    }
    this.showSpecificModalAction();
  }

  /** Errores (bloquean la publicación) y advertencias de la versión, con enlace a cada nodo. */
  onClickRevisar() {
    this.validacion = undefined;
    this.validando = true;
    this.showSpecificModalAction('VALIDACION');
    this.novelasVersionesService
      .getValidacion(this.novelaVersionId)
      .subscribe({
        next: validacion => {
          this.validacion = validacion;
          this.validando = false;
        },
        error: () => (this.validando = false),
      });
  }

  irARecurso(recursoId: string) {
    const escena = this.novelaInfo?.escenas?.find(e =>
      e.recursos?.some(r => r.recursoId === recursoId)
    );
    if (!escena) {
      return;
    }

    this.escenasService.getEscena(escena.escenaId).subscribe(escenaCompleta => {
      this.escenaInfo = escenaCompleta;
      this.onSelectNodeShowModalActions(recursoId);
    });
  }

  showSpecificModalAction(value?: string) {
    this.showModalRecursoDelete = value === 'DELETE';
    this.showModalRecursoInfo = value === 'INFO';
    this.showModalEscena = value === 'ESCENA';
    this.showModalEscenaEditar = value === 'ESCENA_EDITAR';
    this.showModalRecursoForm = value === 'RECURSO_FORM';
    this.showModalVariables = value === 'VARIABLES';
    this.showModalValidacion = value === 'VALIDACION';
    this.showModalActions = !!value;
  }
}
