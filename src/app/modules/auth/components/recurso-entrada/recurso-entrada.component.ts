import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { IEntrada } from '@models/recurso.interfaces';

@Component({
  selector: 'app-recurso-entrada',
  templateUrl: './recurso-entrada.component.html',
  styleUrls: ['./recurso-entrada.component.scss'],
})
export class RecursoEntradaComponent {
  @Input() recursoEntrada!: IEntrada;
  @Output() recursoEntradaReady = new EventEmitter<string>();

  recursoEntradaForm!: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {
    this.recursoEntradaForm = this.fb.group({
      entradaEmail: ['', [Validators.required, Validators.email]],
    });
  }

  onClickRegisterValue() {
    const email = this.recursoEntradaForm.get('entradaEmail')?.value;
    console.log(email);
    this.recursoEntradaReady.emit(email);
  }
}
