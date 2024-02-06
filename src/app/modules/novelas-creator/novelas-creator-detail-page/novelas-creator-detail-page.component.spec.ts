import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelasCreatorDetailPageComponent } from './novelas-creator-detail-page.component';

describe('NovelasCreatorDetailPageComponent', () => {
  let component: NovelasCreatorDetailPageComponent;
  let fixture: ComponentFixture<NovelasCreatorDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovelasCreatorDetailPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovelasCreatorDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
