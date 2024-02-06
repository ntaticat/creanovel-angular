import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { IEscenaPost } from '@models/escena.interfaces';

@Component({
  selector: 'app-escena-creator-form',
  templateUrl: './escena-creator-form.component.html',
  styleUrls: ['./escena-creator-form.component.scss'],
})
export class EscenaCreatorFormComponent implements OnInit {
  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required],
  });

  novelaId?: string = '';

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {}

  onSubmitNovela() {
    if (!this.escenaForm.valid) {
      return;
    }
    const escenaPost: IEscenaPost = { ...this.escenaForm.value };
    escenaPost.novelaVersionId = this.novelaId!;

    console.log('escenaPost', escenaPost);
  }
}
