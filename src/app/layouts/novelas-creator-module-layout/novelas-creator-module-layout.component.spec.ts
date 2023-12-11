import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelasCreatorModuleLayoutComponent } from './novelas-creator-module-layout.component';

describe('NovelasCreatorModuleLayoutComponent', () => {
  let component: NovelasCreatorModuleLayoutComponent;
  let fixture: ComponentFixture<NovelasCreatorModuleLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NovelasCreatorModuleLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NovelasCreatorModuleLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
