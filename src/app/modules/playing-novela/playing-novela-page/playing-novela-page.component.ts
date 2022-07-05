import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as usuarioActions from "@store/usuarios/usuarios.actions";
import * as usuarioSelectors from "@store/usuarios/usuarios.selectors";
import { novelaActions, novelaSelectors } from "@store/novelas/novelas.index";

@Component({
  selector: 'app-playing-novela-page',
  templateUrl: './playing-novela-page.component.html',
  styleUrls: ['./playing-novela-page.component.scss']
})
export class PlayingNovelaPageComponent implements OnInit {

  novelaId: string = "";

  constructor(private activatedRoute: ActivatedRoute, private store: Store<AppState>) {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params["id"];
    });
  }

  async ngOnInit() {
    this.store.dispatch(novelaActions.GET_NOVELA({ novelaId: this.novelaId }));



    const novelaWasPlayed = await this.isNovelaInLecturas(this.novelaId);

    if (novelaWasPlayed) {
      this.store.dispatch(usuarioActions.PLAY_NOVEL({ novelaId: this.novelaId }));
    }
    else {
      this.store.dispatch(usuarioActions.PLAY_NOVEL_FIRST_TIME({ novelaId: this.novelaId }));
    }
  }

  isNovelaInLecturas(novelaId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
        if (usuario?.lecturas) {
          const lecturaIndex = usuario.lecturas.findIndex((lectura) => lectura.novelaRegistrosId === this.novelaId);
          resolve(lecturaIndex !== -1);
          return;
        }
        else {
          resolve(false);
          return;
        }
      });
    });
  }



}
