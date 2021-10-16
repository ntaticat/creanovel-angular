import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IEscenaPost } from '@models/escena.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import { Observable } from 'rxjs';
import * as escenaActions from "@store/escenas/escenas.actions";
import * as novelaSelectors from "@store/novelas/novelas.selectors";

@Component({
  selector: 'app-escena-creator-form',
  templateUrl: './escena-creator-form.component.html',
  styleUrls: ['./escena-creator-form.component.scss']
})
export class EscenaCreatorFormComponent implements OnInit {

  escenaForm: FormGroup = this.fb.group({
    identificador: ['', Validators.required]
  });

  constructor(private store: Store<AppState>, private fb: FormBuilder) {
    // this.isLoading = this.store.pipe(select(novelaSelectors.loading));
    // this.loadedSuccess = this.store.pipe(select(novelaSelectors.loadedSuccess));
  }

  ngOnInit(): void {
  }

  onSubmitNovela() {
    if(!this.escenaForm.valid) { return };
    const escenaPost: IEscenaPost = {...this.escenaForm.value};

    // this.store.pipe(select(novelaSelectors.getNovelas));

    this.store.dispatch(escenaActions.CREATE_ESCENA({payload: escenaPost}));
  }

}
