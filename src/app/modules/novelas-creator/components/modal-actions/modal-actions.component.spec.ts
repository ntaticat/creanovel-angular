import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalActionsComponent } from './modal-actions.component';

describe('ModalActionsComponent', () => {
  let component: ModalActionsComponent;
  let fixture: ComponentFixture<ModalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
