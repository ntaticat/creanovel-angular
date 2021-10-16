import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { INovela, INovelaPost } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelasCreatorSelectors from "@store/novela-creator/novelas-creator.selectors";
import { Observable } from 'rxjs';

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  styleUrls: ['./novela-creator-page.component.scss']
})
export class NovelaCreatorPageComponent implements OnInit {

  novelaInfo?: INovela;

  constructor(private store: Store<AppState>) {
    this.store.pipe(select(novelasCreatorSelectors.novela)).subscribe((novela) => {
      this.novelaInfo = novela;
    });
  }

  ngOnInit(): void {
  }
}
