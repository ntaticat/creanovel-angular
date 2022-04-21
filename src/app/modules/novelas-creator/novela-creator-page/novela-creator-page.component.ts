import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { INovela, INovelaPost } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as novelaSelectors from "@store/novelas/novelas.selectors";
import * as novelaActions from "@store/novelas/novelas.actions";
import { PanZoomConfig } from 'ngx-panzoom';
import { Observable } from 'rxjs';
import * as faIcons from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  styleUrls: ['./novela-creator-page.component.scss']
})
export class NovelaCreatorPageComponent implements OnInit {

  panZoomConfig: PanZoomConfig = new PanZoomConfig();
  faIcons = faIcons;

  novelaId: string = "";
  novelaInfo?: INovela;

  constructor(private store: Store<AppState>) {
    // this.store.dispatch(novelaActions.GET_NOVELA_BY_ID(novelaId));
  }

  ngOnInit(): void {
    this.store.pipe(select(novelaSelectors.novela)).subscribe((novela) => {
      if (novela) {
        this.novelaInfo = novela;
      }
    });
  }
}
