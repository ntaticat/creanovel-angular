import { Component, Input } from '@angular/core';
import { IConversacion } from '@models/recurso.interfaces';
import {
  faArrowRight,
  faArrowLeft,
  faCog,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-recurso-conversacion',
  templateUrl: './recurso-conversacion.component.html',
  styleUrls: ['./recurso-conversacion.component.scss'],
})
export class RecursoConversacionComponent {
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faCog = faCog;

  @Input() recursoConversacion!: IConversacion;
}
