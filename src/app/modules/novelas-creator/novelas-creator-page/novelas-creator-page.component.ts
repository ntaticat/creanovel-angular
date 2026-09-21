import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { INovela, INovelaPost } from '@models/novela.interfaces';
import {
  faArrowLeft,
  faUserGroup,
  faPlus,
  faBook,
  faEdit,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IUsuario } from '@models/usuario.interfaces';
import { NovelasService } from '@services/novelas.service';
import { UploadsService } from '@services/uploads.service';
import { firstValueFrom } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ModalActionsComponent } from '../components/modal-actions/modal-actions.component';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-novelas-creator-page',
  templateUrl: './novelas-creator-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    FaIconComponent,
    ModalActionsComponent,
    SpinnerComponent,
    EmptyStateComponent,
  ],
})
export class NovelasCreatorPageComponent implements OnInit {
  usuarioData: IUsuario = this.route.snapshot.data['usuarioData'];

  faArrowLeft = faArrowLeft;
  faUserGroup = faUserGroup;
  faPlus = faPlus;
  faBook = faBook;
  faEdit = faEdit;
  faCheck = faCheck;

  showModalCreandoNovela = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: NovelasService,
    private uploadsService: UploadsService
  ) {}

  ngOnInit(): void {}

  async onClickButtonCrearNovela() {
    this.showModalCreandoNovela = true;
    const novelaId = await this.createNovela();
    const novela = await this.getNovelaInfo(novelaId);
    const novelaVersionId = this.getNovelaVersionId(novela);

    this.showModalCreandoNovela = false;

    if (!novelaVersionId) {
      console.error('No se creó la versión de la novela');
      return;
    }

    this.sendToEditor(novelaVersionId);
  }

  async createNovela() {
    const data: INovelaPost = {
      titulo: 'Título de novela',
      descripcion: 'Aquí habrá una descripción de tu novela',
      disponible: false,
      usuarioCreadorId: this.usuarioData.id,
    };

    const novelaId = await firstValueFrom(this.api.postNovela(data));
    return novelaId;
  }

  async getNovelaInfo(novelaId: string) {
    const novelaWithVersions = await firstValueFrom(
      this.api.getNovela(novelaId, 'True')
    );
    return novelaWithVersions;
  }

  getNovelaVersionId(novela: INovela) {
    if (!novela.versiones) {
      return undefined;
    }

    return novela.versiones[0].novelaVersionId;
  }

  sendToEditor(novelaVersionId: string) {
    this.router.navigate(['/', 'novelas-creator', 'editor', novelaVersionId]);
  }

  resolverUrl(url?: string): string {
    return this.uploadsService.resolveUrl(url);
  }
}
