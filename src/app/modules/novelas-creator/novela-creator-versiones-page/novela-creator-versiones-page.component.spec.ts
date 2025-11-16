import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelaCreatorVersionesPageComponent } from './novela-creator-versiones-page.component';

describe('NovelaCreatorVersionesPageComponent', () => {
  let component: NovelaCreatorVersionesPageComponent;
  let fixture: ComponentFixture<NovelaCreatorVersionesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovelaCreatorVersionesPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovelaCreatorVersionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
