import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelaCreatorVersionPageComponent } from './novela-creator-version-page.component';

describe('NovelaCreatorVersionPageComponent', () => {
  let component: NovelaCreatorVersionPageComponent;
  let fixture: ComponentFixture<NovelaCreatorVersionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovelaCreatorVersionPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovelaCreatorVersionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
