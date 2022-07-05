import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ILectura } from 'src/app/data/models/lectura.interfaces';
import { INovela } from '@models/novela.interfaces';
import { AppState } from 'src/app/store/app.reducer';

import * as faIcons from '@fortawesome/free-solid-svg-icons';

import * as novelasActions from 'src/app/store/novelas/novelas.actions';
import * as novelasSelectors from '@store/novelas/novelas.selectors';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import * as usuarioActions from '@store/usuarios/usuarios.actions';
import { skip } from 'rxjs/operators';

@Component({
  selector: 'app-novelas',
  templateUrl: './novelas.component.html',
  styleUrls: ['./novelas.component.scss']
})
export class NovelasComponent implements OnInit, OnDestroy {

  faIcons = faIcons;

  lecturas?: ILectura[] = [];
  novelasCreadas?: INovela[] = [];

  novelasSub: Subscription;
  novelasPlayer: INovelaUser[] = [];

  constructor(private store: Store<AppState>, private router: Router) {

    this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
      this.lecturas = usuario?.lecturas;
      this.novelasCreadas = usuario?.novelasCreadas;
      console.log("NOVELAS CREA", usuario);
    });


    this.novelasSub = this.store.pipe(select(novelasSelectors.getNovelas), skip(1)).subscribe(novelas => {
      console.log("Novelas response", novelas);
      this.novelasPlayer = novelas.map((novela) => {
        const newNovela: INovelaUser = {
          novela: {...novela},
          created: this.novelaCreada(novela),
          played: this.novelaJugada(novela),
        };
        return newNovela;
      });
    });
  }

  ngOnInit(): void {
    this.store.dispatch(novelasActions.GET_NOVELAS());
  }

  ngOnDestroy(): void {
    this.novelasSub.unsubscribe();
  }

  novelaJugada(novela: INovela) {
    const novelaIndex = this.lecturas!.findIndex((lectura) => lectura.novelaRegistrosId === novela.novelaId);
    return novelaIndex !== -1;
  }

  novelaCreada(novela: INovela) {
    const novelaIndex = this.novelasCreadas!.findIndex((novelaCreada) => novelaCreada.novelaId === novela.novelaId);
    return novelaIndex !== -1;
  }

  jugarNovela(novela: INovelaUser) {
    if(!novela.played) {
      this.store.dispatch(usuarioActions.PLAY_NOVEL_FIRST_TIME({novelaId: novela.novela.novelaId}));
    }
  }
}

export interface INovelaUser {
  novela: INovela;
  played: boolean;
  created: boolean;
}
