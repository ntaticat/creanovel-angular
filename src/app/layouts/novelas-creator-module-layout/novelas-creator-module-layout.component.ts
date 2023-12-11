import { Component, OnInit } from '@angular/core';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novelas-creator-module-layout',
  templateUrl: './novelas-creator-module-layout.component.html',
  styleUrls: ['./novelas-creator-module-layout.component.scss'],
})
export class NovelasCreatorModuleLayoutComponent implements OnInit {
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
