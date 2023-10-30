import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursoEntradaComponent } from './recurso-entrada.component';

describe('RecursoEntradaComponent', () => {
  let component: RecursoEntradaComponent;
  let fixture: ComponentFixture<RecursoEntradaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecursoEntradaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecursoEntradaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
