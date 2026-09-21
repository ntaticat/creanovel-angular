import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { IVariableDef, VariableValor } from '@models/motor.interfaces';

/** Campo para el valor de una variable, según su tipo: número, sí/no, o texto (libre o de una lista). */
@Component({
  selector: 'app-variable-valor-input',
  templateUrl: './variable-valor-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class VariableValorInputComponent {
  @Input() def?: IVariableDef;
  @Input() valor?: VariableValor | null;
  @Input() etiqueta = 'Valor';

  @Output() valorChange = new EventEmitter<VariableValor>();

  cambioNumero(texto: string): void {
    const numero = Number(texto);
    if (texto.trim() !== '' && Number.isFinite(numero)) {
      this.valorChange.emit(numero);
    }
  }
}
