import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ILectura } from 'src/app/data/models/lectura.interfaces';
import { INovela } from '@models/novela.interfaces';

import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { skip } from 'rxjs/operators';
import { NovelasService } from '@services/novelas.service';
import { IUsuario } from '@models/usuario.interfaces';

@Component({
  selector: 'app-novelas',
  templateUrl: './novelas.component.html',
  styleUrls: ['./novelas.component.scss'],
})
export class NovelasComponent implements OnInit, OnDestroy {
  usuarioData: IUsuario = this.route.snapshot.data['usuarioData'];
  faIcons = faIcons;

  lecturas?: ILectura[] = [];
  novelasCreadas?: INovela[] = [];

  novelasSub: Subscription;
  novelasPlayer: INovelaUser[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private novelasService: NovelasService
  ) {
    this.novelasSub = novelasService.getNovelas().subscribe(novelas => {
      this.novelasPlayer = novelas.map(novela => {
        const novelaUser: INovelaUser = {
          novela: novela,
          played: novela.usuarioCreadorId === this.usuarioData.id,
          created: this.novelaCreada(novela),
        };

        return novelaUser;
      });
      console.log(novelas);
      console.log('resolve', this.usuarioData);
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.novelasSub.unsubscribe();
  }

  novelaJugada(novela: INovela) {
    const novelaIndex = this.usuarioData.lecturas!.findIndex(
      lectura => lectura.novelaRegistrosId === novela.novelaId
    );
    return novelaIndex !== -1;
  }

  novelaCreada(novela: INovela) {
    const novelaIndex = this.usuarioData.novelasCreadas!.findIndex(
      novelaCreada => novelaCreada.novelaId === novela.novelaId
    );
    return novelaIndex !== -1;
  }

  jugarNovela(novela: INovelaUser) {
    if (!novela.played) {
    }
  }
}

export interface INovelaUser {
  novela: INovela;
  played: boolean;
  created: boolean;
}
