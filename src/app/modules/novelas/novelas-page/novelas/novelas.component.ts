import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { INovela } from 'src/app/data/models/novela.interface';
import { AppState } from 'src/app/store/app.reducer';
import * as novelasActions from 'src/app/store/novelas/novelas.actions';
import * as novelasSelectors from 'src/app/store/novelas/novelas.selectors';

@Component({
  selector: 'app-novelas',
  templateUrl: './novelas.component.html',
  styleUrls: ['./novelas.component.scss']
})
export class NovelasComponent implements OnInit, OnDestroy {

  lecturas: any[] = [];
  novelasCreadas: any[] = [];

  novelasSub: Subscription;
  novelasPlayer: INovelaUser[] = [];

  constructor(private store: Store<AppState>) {

    this.store.subscribe(({usuarios}) => {
      this.lecturas = usuarios.object.lecturas;
      this.novelasCreadas = usuarios.object.novelasCreadas;
    });


    this.novelasSub = this.store.pipe(select(novelasSelectors.getNovelas))
    .subscribe(novelas => {
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
    const novelaIndex = this.lecturas.findIndex((lectura) => lectura.novelaRegistrosId === novela.novelaId);
    return novelaIndex !== -1;
  }

  novelaCreada(novela: INovela) {
    const novelaIndex = this.novelasCreadas.findIndex((novelaCreada) => novelaCreada.novelaId === novela.novelaId);
    return novelaIndex !== -1;
  }
}

export interface INovelaUser {
  novela: INovela;
  played: boolean;
  created: boolean;
}
