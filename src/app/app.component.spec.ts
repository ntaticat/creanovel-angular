import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppComponent } from './app.component';

@Component({ template: 'pagina' })
class PaginaFalsa {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'creanovel'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('creanovel');
  });

  it('la instancia raíz dibuja el aviso de actualización', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.esRaiz).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('app-aviso-actualizacion').length).toBe(1);
  });

  it('la instancia anidada como ruta de layout no lo repite', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: AppComponent, children: [{ path: '', component: PaginaFalsa }] }])],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/');

    const anidada = harness.routeDebugElement!.componentInstance as AppComponent;
    expect(anidada.esRaiz).toBeFalse();
    expect(harness.routeNativeElement!.querySelectorAll('app-aviso-actualizacion').length).toBe(0);
  });
});
