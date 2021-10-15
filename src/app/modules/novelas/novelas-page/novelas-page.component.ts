import { AppState } from 'src/app/store/app.reducer';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as usuarioActions from 'src/app/store/usuarios/usuarios.actions';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novelas-page',
  templateUrl: './novelas-page.component.html',
  styleUrls: ['./novelas-page.component.scss']
})
export class NovelasPageComponent implements OnInit {

  faCog = faCog;
  faSignOutAlt = faSignOutAlt;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {

  }

}
