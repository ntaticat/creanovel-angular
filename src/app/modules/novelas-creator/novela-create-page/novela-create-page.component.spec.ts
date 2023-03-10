import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovelaCreatePageComponent } from './novela-create-page.component';

describe('NovelaCreatePageComponent', () => {
  let component: NovelaCreatePageComponent;
  let fixture: ComponentFixture<NovelaCreatePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NovelaCreatePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovelaCreatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
