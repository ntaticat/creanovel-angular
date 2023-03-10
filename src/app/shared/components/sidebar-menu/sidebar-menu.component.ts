import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as usuarioActions from 'src/app/store/usuarios/usuarios.actions';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
})
export class SidebarMenuComponent {
  constructor(private store: Store<AppState>) {}

  logout() {
    this.store.dispatch(usuarioActions.LOGOUT());
  }
}
