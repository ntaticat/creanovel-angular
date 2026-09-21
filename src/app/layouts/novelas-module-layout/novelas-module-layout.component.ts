import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '@services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { SidebarMenuComponent } from '../../shared/components/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-novelas-module-layout',
  templateUrl: './novelas-module-layout.component.html',
  styleUrls: ['./novelas-module-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    FaIconComponent,
    NgClass,
    RouterOutlet,
    SidebarMenuComponent,
  ],
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
