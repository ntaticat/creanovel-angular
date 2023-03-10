import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as usuarioActions from 'src/app/store/usuarios/usuarios.actions';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AppState } from 'src/app/store/app.reducer';

@Component({
  selector: 'app-novelas-module-layout',
  templateUrl: './novelas-module-layout.component.html',
  styleUrls: ['./novelas-module-layout.component.scss'],
})
export class NovelasModuleLayoutComponent implements OnInit {
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;
  showSearchInfo: boolean = false;
  showSidebarMenu: boolean = false;

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {}

  public onNovelSearchFocus() {
    this.showSearchInfo = !this.showSearchInfo;
  }

  toggleShowSidebarMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showSidebarMenu = !this.showSidebarMenu;
  }
}
