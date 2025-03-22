import { Component, Input } from '@angular/core';
import { IConversacion, IDecision } from '@models/recurso.interfaces';

@Component({
  selector: 'app-recurso-decision',
  templateUrl: './recurso-decision.component.html',
  styleUrls: ['./recurso-decision.component.scss'],
})
export class RecursoDecisionComponent {
  @Input() recursoDecision!: IDecision;

  constructor() {}
}
