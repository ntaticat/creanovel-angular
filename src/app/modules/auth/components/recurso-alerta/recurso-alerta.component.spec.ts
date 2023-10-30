import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursoAlertaComponent } from './recurso-alerta.component';

describe('RecursoAlertaComponent', () => {
  let component: RecursoAlertaComponent;
  let fixture: ComponentFixture<RecursoAlertaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecursoAlertaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecursoAlertaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
