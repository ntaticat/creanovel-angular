import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { IEscenaPost } from '@models/escena.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as escenaActions from "@store/escenas/escenas.actions";
import * as novelasCreatorSelectors from '@store/novela-creator/novelas-creator.selectors';

@Component({
  selector: 'app-escena-creator-form',
  templateUrl: './escena-creator-form.component.html',
  styleUrls: ['./escena-creator-form.component.scss']
})
export class EscenaCreatorFormComponent implements OnInit {

  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required]
  });

  novelaId?: string = "";

  constructor(private store: Store<AppState>, private fb: UntypedFormBuilder) {
    this.store.pipe(select(novelasCreatorSelectors.novela)).subscribe((novela) => {
      this.novelaId = novela?.novelaId;
    });
  }

  ngOnInit(): void {
  }

  onSubmitNovela() {
    if(!this.escenaForm.valid) { return };
    const escenaPost: IEscenaPost = {...this.escenaForm.value};
    escenaPost.novelaId = this.novelaId!;

    console.log("escenaPost", escenaPost);

    this.store.dispatch(escenaActions.CREATE_ESCENA({payload: escenaPost}));
  }

}
