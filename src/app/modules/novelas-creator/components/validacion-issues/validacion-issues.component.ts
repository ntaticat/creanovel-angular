import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { IValidacionIssue } from '@models/motor.interfaces';

/** Lista de problemas de una versión. Con `irARecurso` enlazado, cada uno con recurso lleva al nodo. */
@Component({
  selector: 'app-validacion-issues',
  templateUrl: './validacion-issues.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ValidacionIssuesComponent {
  @Input() titulo = '';
  @Input() tipo: 'error' | 'advertencia' = 'error';
  @Input() issues: IValidacionIssue[] = [];
  @Input() enlazable = false;

  @Output() irARecurso = new EventEmitter<string>();
}
