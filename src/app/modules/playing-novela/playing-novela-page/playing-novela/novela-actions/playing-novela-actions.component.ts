import {
  IConversacion,
  instanceOfIConversacion,
  instanceOfIDecision,
} from '../../../../../data/models/recurso.interfaces';
import { Component, OnInit } from '@angular/core';
import { ILecturaRecursoPost } from '@models/lectura.interfaces';

@Component({
  selector: 'app-playing-novela-actions',
  templateUrl: './playing-novela-actions.component.html',
  styleUrls: ['./playing-novela-actions.component.scss'],
})
export class PlayingNovelaActionsComponent implements OnInit {
  lecturaId: string = '';
  siguienteRecursoId?: string = '';

  constructor() {}

  ngOnInit(): void {}

  nextRecurso() {
    console.log('lecturaID', this.lecturaId);
    console.log('siguienteRecursoID', this.siguienteRecursoId);

    if (this.siguienteRecursoId) {
      const payload: ILecturaRecursoPost = {
        lecturaId: this.lecturaId,
        recursoId: this.siguienteRecursoId,
        recursoOrder: 1, // TODO: CREAR METODO PARA ASIGNAR ORDEN A LOS RECURSOS
      };
      console.log(payload);
    }
  }
}
