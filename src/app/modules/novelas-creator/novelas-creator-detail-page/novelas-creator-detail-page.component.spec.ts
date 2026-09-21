import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NovelasCreatorDetailPageComponent } from './novelas-creator-detail-page.component';

describe('NovelasCreatorDetailPageComponent', () => {
  let component: NovelasCreatorDetailPageComponent;
  let fixture: ComponentFixture<NovelasCreatorDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovelasCreatorDetailPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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
