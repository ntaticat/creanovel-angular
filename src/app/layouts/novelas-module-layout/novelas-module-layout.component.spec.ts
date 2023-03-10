import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelasModuleLayoutComponent } from './novelas-module-layout.component';

describe('NovelasModuleLayoutComponent', () => {
  let component: NovelasModuleLayoutComponent;
  let fixture: ComponentFixture<NovelasModuleLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NovelasModuleLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovelasModuleLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
