import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SidebarMenuComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    console.log('LOGOUT');
    this.authService.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}
