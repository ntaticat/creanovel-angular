import { Component, OnInit } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelasCreatorSelectors from '@store/novela-creator/novelas-creator.selectors';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-novela-creator-escena',
  templateUrl: './novela-creator-escena.component.html',
  styleUrls: ['./novela-creator-escena.component.scss']
})
export class NovelaCreatorEscenaComponent implements OnInit {

  novelaInfo: Observable<INovela | undefined>;

  constructor(private store: Store<AppState>) {
    this.novelaInfo = this.store.pipe(select(novelasCreatorSelectors.novela))!;
  }

  ngOnInit(): void {
  }

}
