import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@services/auth.service';

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

  constructor() {}

  ngOnInit(): void {}

  public onNovelSearchFocus() {
    this.showSearchInfo = !this.showSearchInfo;
  }

  toggleShowSidebarMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showSidebarMenu = !this.showSidebarMenu;
  }
}
