import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SidebarMenuComponent } from './components/sidebar-menu/sidebar-menu.component';

@NgModule({
  declarations: [SidebarMenuComponent],
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  exports: [ReactiveFormsModule, FontAwesomeModule, SidebarMenuComponent],
})
export class SharedModule {}
