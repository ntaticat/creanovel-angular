import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelaCreatorLayoutComponent } from './novela-creator-layout.component';

describe('NovelaCreatorLayoutComponent', () => {
  let component: NovelaCreatorLayoutComponent;
  let fixture: ComponentFixture<NovelaCreatorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NovelaCreatorLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NovelaCreatorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
