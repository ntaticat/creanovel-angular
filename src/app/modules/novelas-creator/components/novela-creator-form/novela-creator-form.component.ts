import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { INovelaPost } from '@models/novela.interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-novela-creator-form',
  templateUrl: './novela-creator-form.component.html',
  styleUrls: ['./novela-creator-form.component.scss'],
})
export class NovelaCreatorFormComponent implements OnInit {
  isLoading!: Observable<boolean>;
  loadedSuccess!: Observable<boolean>;

  novelaForm: UntypedFormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {}

  onSubmitNovela() {
    if (!this.novelaForm.valid) {
      return;
    }
    const novelaPost: INovelaPost = { ...this.novelaForm.value };
    novelaPost.disponible = false;
  }
}
