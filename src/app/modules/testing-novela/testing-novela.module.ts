import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestingNovelaRoutingModule } from './testing-novela-routing.module';
import { TestingNovelaPageComponent } from './testing-novela-page/testing-novela-page.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [TestingNovelaPageComponent],
  imports: [CommonModule, TestingNovelaRoutingModule, SharedModule],
})
export class TestingNovelaModule {}
