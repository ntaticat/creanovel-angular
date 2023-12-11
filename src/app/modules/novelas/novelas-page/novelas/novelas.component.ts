import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ILectura } from 'src/app/data/models/lectura.interfaces';
import { INovela } from '@models/novela.interfaces';

import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { skip } from 'rxjs/operators';

@Component({
  selector: 'app-novelas',
  templateUrl: './novelas.component.html',
  styleUrls: ['./novelas.component.scss'],
})
export class NovelasComponent implements OnInit, OnDestroy {
  faIcons = faIcons;

  lecturas?: ILectura[] = [];
  novelasCreadas?: INovela[] = [];

  novelasSub!: Subscription;
  novelasPlayer: INovelaUser[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.novelasSub.unsubscribe();
  }

  novelaJugada(novela: INovela) {
    const novelaIndex = this.lecturas!.findIndex(
      lectura => lectura.novelaRegistrosId === novela.novelaId
    );
    return novelaIndex !== -1;
  }

  novelaCreada(novela: INovela) {
    const novelaIndex = this.novelasCreadas!.findIndex(
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
