import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursoDecisionComponent } from './recurso-decision.component';

describe('RecursoDecisionComponent', () => {
  let component: RecursoDecisionComponent;
  let fixture: ComponentFixture<RecursoDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecursoDecisionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecursoDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
