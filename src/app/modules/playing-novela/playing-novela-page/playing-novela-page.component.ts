import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as usuarioActions from "@store/usuarios/usuarios.actions";

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
      this.store.dispatch(usuarioActions.PLAY_NOVEL({novelaId: this.novelaId}));
      console.log("this.novelaId", this.novelaId);
    });

  }

  ngOnInit(): void {
  }

}
