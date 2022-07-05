import { IConversacion, instanceOfIConversacion, instanceOfIDecision } from '../../../../../data/models/recurso.interfaces';
import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as lecturaActions from "@store/lecturas/lecturas.actions";
import * as lecturaSelectors from "@store/lecturas/lecturas.selectors";
import * as usuarioSelectors from "@store/usuarios/usuarios.selectors";
import { ILecturaRecursoPost } from '@models/lectura.interfaces';

@Component({
  selector: 'app-playing-novela-actions',
  templateUrl: './playing-novela-actions.component.html',
  styleUrls: ['./playing-novela-actions.component.scss']
})
export class PlayingNovelaActionsComponent implements OnInit {

  lecturaId: string = "";
  siguienteRecursoId?: string = "";

  constructor(private store: Store<AppState>) {
    this.store.pipe(select(lecturaSelectors.lectura)).subscribe((lectura) => {
      console.log("LECTURA ", lectura);
      if(lectura) {
        this.lecturaId = lectura.lecturaId;
      }
    });
    this.store.pipe(select(lecturaSelectors.recursoActual)).subscribe((recursoActual) => {

      if(!recursoActual) return;

      if(instanceOfIConversacion(recursoActual)) {
      console.log("RECURSOACTUAL ", recursoActual);
        this.siguienteRecursoId = recursoActual?.siguienteRecursoId;
      }
    });
  }

  ngOnInit(): void {
  }

  nextRecurso() {

    console.log("lecturaID", this.lecturaId);
    console.log("siguienteRecursoID", this.siguienteRecursoId);

    if(this.siguienteRecursoId) {
      const payload: ILecturaRecursoPost = {
        lecturaId: this.lecturaId,
        recursoId: this.siguienteRecursoId,
        recursoOrder: 1 // TODO: CREAR METODO PARA ASIGNAR ORDEN A LOS RECURSOS
      }
      console.log(payload);
      this.store.dispatch(lecturaActions.POST_LECTURA_RECURSO({payload}));
    }
  }
}
