import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { INovelaPost } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { Observable } from 'rxjs';
import * as novelaActions from "@store/novelas/novelas.actions";
import * as novelaSelectors from "@store/novelas/novelas.selectors";
import * as usuarioSelectors from "@store/usuarios/usuarios.selectors";

@Component({
  selector: 'app-novela-creator-form',
  templateUrl: './novela-creator-form.component.html',
  styleUrls: ['./novela-creator-form.component.scss']
})
export class NovelaCreatorFormComponent implements OnInit {

  isLoading: Observable<boolean>;
  loadedSuccess: Observable<boolean>;

  novelaForm: UntypedFormGroup = this.fb.group({
    titulo: ["", Validators.required],
    descripcion: ["", Validators.required],
    disponible: [false, Validators.required],
  });

  constructor(private store: Store<AppState>, private fb: UntypedFormBuilder) {
    this.isLoading = this.store.pipe(select(novelaSelectors.loading));
    this.loadedSuccess = this.store.pipe(select(novelaSelectors.loadedSuccess));
  }

  ngOnInit(): void {
  }

  onSubmitNovela() {
    if(!this.novelaForm.valid) { return };
    const novelaPost: INovelaPost = {...this.novelaForm.value};

    this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
      novelaPost.usuarioCreadorId = usuario.id;
    });

    this.store.dispatch(novelaActions.CREATE_NOVELA({payload: novelaPost}));
  }

}
