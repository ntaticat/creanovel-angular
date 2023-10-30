import { Component } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-recurso-entrada',
  templateUrl: './recurso-entrada.component.html',
  styleUrls: ['./recurso-entrada.component.scss'],
})
export class RecursoEntradaComponent {
  recursoEntradaControl: UntypedFormControl;

  constructor(private fb: UntypedFormBuilder) {
    this.recursoEntradaControl = this.fb.control('', [Validators.required]);
  }

  onClickRegisterValue() {}
}
