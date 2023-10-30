import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursoConversacionComponent } from './recurso-conversacion.component';

describe('RecursoConversacionComponent', () => {
  let component: RecursoConversacionComponent;
  let fixture: ComponentFixture<RecursoConversacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecursoConversacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecursoConversacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
