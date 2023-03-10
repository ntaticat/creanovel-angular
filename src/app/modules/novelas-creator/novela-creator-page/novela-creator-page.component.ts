import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import * as novelaCreatorActions from '@store/novela-creator/novelas-creator.actions';
import * as escenaActions from '@store/escenas/escenas.actions';
import * as novelaCreatorSelectors from '@store/novela-creator/novelas-creator.selectors';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { IEscena, IEscenaPost } from '@models/escena.interfaces';
import {
  instanceOfIConversacion,
  instanceOfIDecision,
} from '@models/recurso.interfaces';

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  styleUrls: ['./novela-creator-page.component.scss'],
})
export class NovelaCreatorPageComponent implements OnInit {
  instanceOfIConversacion = instanceOfIConversacion;
  instanceOfIDecision = instanceOfIDecision;

  faIcons = faIcons;

  novelaId: string = '';
  novelaInfo?: INovela;
  escenaInfo?: IEscena;

  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required],
  });

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private fb: UntypedFormBuilder
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params['id'];
    });
    console.log('NOVELAID', this.novelaId);
  }

  ngOnInit(): void {
    this.store.dispatch(
      novelaCreatorActions.GET_CREATOR_NOVELA({ payload: this.novelaId })
    );
    this.store
      .pipe(select(novelaCreatorSelectors.novela))
      .subscribe((novela) => {
        if (novela) {
          this.novelaInfo = novela;
          console.log(this.novelaInfo);
        }
      });
    this.store
      .pipe(select(novelaCreatorSelectors.escena))
      .subscribe((escena) => {
        if (escena) {
          this.escenaInfo = escena;
          this.escenaInfo.recursos.forEach((recurso) => {
            console.log('RECURSO TIPO: ', typeof recurso);
            console.log(
              'RECURSO IS CONVERSACION: ',
              instanceOfIConversacion(recurso)
            );
            console.log('RECURSO IS DECISION: ', instanceOfIDecision(recurso));
          });
          console.log(this.escenaInfo);
        }
      });
  }

  onSubmitEscena() {
    if (!this.escenaForm.valid) {
      return;
    }
    const escenaPost: IEscenaPost = {
      ...this.escenaForm.value,
      primerEscena: false,
      ultimaEscena: false,
    };
    escenaPost.novelaId = this.novelaId!;
    console.log('escenaPost', escenaPost);
    this.store.dispatch(escenaActions.CREATE_ESCENA({ payload: escenaPost }));
  }

  onClickEscena(escenaId: string) {
    console.log('ONCLICKESCENA');
    this.store.dispatch(
      novelaCreatorActions.GET_CREATOR_ESCENA({ payload: escenaId })
    );
  }
}
