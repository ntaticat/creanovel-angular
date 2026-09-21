import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { INovela } from '@models/novela.interfaces';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { NovelasService } from '@services/novelas.service';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { ModalActionsComponent } from '../components/modal-actions/modal-actions.component';
import { PersonajeCreatorFormComponent } from '../components/personaje-creator-form/personaje-creator-form.component';
import { FondoCreatorFormComponent } from '../components/fondo-creator-form/fondo-creator-form.component';
import { NovelaCreatorFormComponent } from '../components/novela-creator-form/novela-creator-form.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserGroup, faImage, faPen } from '@fortawesome/free-solid-svg-icons';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { extraerErrores } from 'src/app/shared/utils/http-errors.util';
import {
  versionStatusLabel,
  versionStatusBadgeClass,
} from 'src/app/shared/utils/version-status.util';

@Component({
  selector: 'app-novelas-creator-detail-page',
  templateUrl: './novelas-creator-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ModalActionsComponent,
    PersonajeCreatorFormComponent,
    FondoCreatorFormComponent,
    RouterLink,
    NovelaCreatorFormComponent,
    FaIconComponent,
    SpinnerComponent,
  ],
})
export class NovelasCreatorDetailPageComponent implements OnInit {
  novelaId!: string;
  novelaInfo?: INovela;
  versiones: INovelaVersion[] = [];
  creandoBorrador = false;
  publicandoVersionId = '';
  /** Motivos por los que el backend rechazó la publicación (validación de la versión). */
  erroresPublicacion: string[] = [];

  showModalPersonajes = false;
  showModalFondos = false;

  faArrowLeft = faArrowLeft;
  faUserGroup = faUserGroup;
  faImage = faImage;
  faPen = faPen;

  versionStatusLabel = versionStatusLabel;
  versionStatusBadgeClass = versionStatusBadgeClass;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private novelasService: NovelasService,
    private novelasVersionesService: NovelasVersionesService
  ) {
    this.route.params.subscribe(params => {
      this.novelaId = params['novelaId'];
    });
  }

  ngOnInit(): void {
    this.cargarNovela();
    this.cargarVersiones();
  }

  cargarNovela(): void {
    this.novelasService
      .getNovela(this.novelaId, 'True', 'True', 'True')
      .subscribe(novela => {
        this.novelaInfo = novela;
      });
  }

  cargarVersiones(): void {
    this.novelasVersionesService
      .getNovelaVersiones(this.novelaId)
      .subscribe(versiones => {
        this.versiones = versiones;
      });
  }

  get tieneBorrador(): boolean {
    return this.versiones.some(v => v.esBorrador);
  }

  get tienePublicada(): boolean {
    return this.versiones.some(v => v.disponible);
  }

  onClickCrearBorrador(): void {
    if (this.creandoBorrador || this.tieneBorrador || !this.tienePublicada) {
      return;
    }

    this.creandoBorrador = true;
    this.novelasVersionesService
      .postCrearBorrador(this.novelaId)
      .subscribe(novelaVersionId => {
        this.creandoBorrador = false;
        this.router.navigate(['/novelas-creator', 'editor', novelaVersionId]);
      });
  }

  onClickEditarVersion(version: INovelaVersion): void {
    this.router.navigate(['/novelas-creator', 'editor', version.novelaVersionId]);
  }

  onClickPublicarVersion(version: INovelaVersion): void {
    if (this.publicandoVersionId) {
      return;
    }

    this.publicandoVersionId = version.novelaVersionId;
    this.erroresPublicacion = [];
    this.novelasVersionesService
      .postPublicarVersion(version.novelaVersionId)
      .subscribe({
        next: () => {
          this.publicandoVersionId = '';
          this.cargarVersiones();
          this.cargarNovela();
        },
        error: error => {
          this.publicandoVersionId = '';
          this.erroresPublicacion = extraerErrores(error, 'No se pudo publicar la versión.');
        },
      });
  }

  onNovelaActualizada(): void {
    this.cargarNovela();
  }

  onAssetAsociado(): void {
    this.showModalPersonajes = false;
    this.showModalFondos = false;
    this.cargarNovela();
  }
}
