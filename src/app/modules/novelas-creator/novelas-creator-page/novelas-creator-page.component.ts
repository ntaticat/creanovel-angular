import { Component, OnInit } from '@angular/core';
import { INovela, INovelaPost } from '@models/novela.interfaces';
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { IUsuario } from '@models/usuario.interfaces';
import { NovelasService } from '@services/novelas.service';

@Component({
  selector: 'app-novelas-creator-page',
  templateUrl: './novelas-creator-page.component.html',
  styleUrls: ['./novelas-creator-page.component.scss'],
})
export class NovelasCreatorPageComponent implements OnInit {
  usuarioData: IUsuario = this.route.snapshot.data['usuarioData'];

  faIcons = faIcons;

  showModalCreandoNovela = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: NovelasService
  ) {
    console.log(this.usuarioData);
  }

  ngOnInit(): void {}

  async onClickButtonCrearNovela() {
    this.showModalCreandoNovela = true;
    const novelaId = await this.createNovela();
    console.log('NOV ID:', novelaId);
    const novela = await this.getNovelaInfo(novelaId);
    console.log('NOV ID:', novela);
    const novelaVersionId = this.getNovelaVersionId(novela);

    if (!novelaVersionId) {
      console.error('No se creó la versión de la novela');
      return;
    }

    this.sendToNovelaVersionPage(novelaId, novelaVersionId);
  }

  async createNovela() {
    const data: INovelaPost = {
      titulo: 'Título de novela',
      descripcion: 'Aquí habrá una descripción de tu novela',
      disponible: false,
      usuarioCreadorId: this.usuarioData.id,
    };

    const novelaId = await this.api.postNovela(data).toPromise();
    return novelaId;
  }

  async getNovelaInfo(novelaId: string) {
    const novelaWithVersions = await this.api
      .getNovela(novelaId, 'True')
      .toPromise();
    return novelaWithVersions;
  }

  getNovelaVersionId(novela: INovela) {
    if (!novela.versiones) {
      return undefined;
    }

    return novela.versiones[0].novelaVersionId;
  }

  sendToNovelaVersionPage(novelaId: string, novelaVersionId: string) {
    this.router.navigate([
      '/',
      'novelas-creator',
      novelaId,
      'versiones',
      novelaVersionId,
    ]);
  }
}
