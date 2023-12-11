import { Component, OnInit } from '@angular/core';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novelas-page',
  templateUrl: './novelas-page.component.html',
  styleUrls: ['./novelas-page.component.scss'],
})
export class NovelasPageComponent implements OnInit {
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;
  showSearchInfo: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  logout() {
  }

  public onNovelSearchFocus() {
    this.showSearchInfo = !this.showSearchInfo;
  }
}
