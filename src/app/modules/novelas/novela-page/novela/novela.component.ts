import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IConversacion, IDecision } from '@models/recurso.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as lecturaSelectors from '@store/lecturas/lecturas.selectors';

@Component({
  selector: 'app-novela',
  templateUrl: './novela.component.html',
  styleUrls: ['./novela.component.scss']
})
export class NovelaComponent implements OnInit {

  @Input() novelaId: string = "";
  recursoActual?: IDecision | IConversacion;
  loadedSuccess = false;

  constructor(private store: Store<AppState>) {
    this.store.pipe(select(lecturaSelectors.recursoActual)).subscribe((recursoActual) => {
      this.recursoActual = recursoActual;
    });

    this.store.pipe(select(lecturaSelectors.loadedSuccess)).subscribe((loadedSuccess) => {
      this.loadedSuccess = loadedSuccess;
    });
  }

  ngOnInit(): void {

  }
}
