import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { INovela } from 'src/app/data/models/novela.interface';
import { AppState } from 'src/app/store/app.reducer';
import * as novelasActions from 'src/app/store/novelas/novelas.actions';
import * as novelasSelectors from 'src/app/store/novelas/novelas.selectors';

@Component({
  selector: 'app-novelas',
  templateUrl: './novelas.component.html',
  styleUrls: ['./novelas.component.scss']
})
export class NovelasComponent implements OnInit, OnDestroy {

  novelas: INovela[] = [];
  novelasSub: Subscription;

  constructor(private store: Store<AppState>) {
    this.novelasSub = this.store.pipe(select(novelasSelectors.getNovelas)).subscribe(novelas => {
      this.novelas = novelas;
    });
  }

  ngOnInit(): void {
    this.store.dispatch(novelasActions.GET_NOVELAS());

  }

  ngOnDestroy(): void {
    this.novelasSub.unsubscribe();
  }
}
