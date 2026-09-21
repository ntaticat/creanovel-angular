import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaPlegableComponent } from './tarjeta-plegable.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TarjetaPlegableComponent],
  template: `
    <app-tarjeta-plegable
      titulo="Salud"
      resumen="salud · número · 0–100"
      [advertencia]="advertencia"
      [resaltada]="resaltada"
      [abierta]="abierta"
      (abiertaChange)="abierta = $event">
      <button acciones type="button" aria-label="Quitar" (click)="quitado = true">x</button>
      <input class="campo" value="90" />
    </app-tarjeta-plegable>
  `,
})
class AnfitrionComponent {
  abierta = false;
  advertencia = '';
  resaltada = false;
  quitado = false;
}

describe('TarjetaPlegableComponent', () => {
  let fixture: ComponentFixture<AnfitrionComponent>;
  let host: AnfitrionComponent;
  const el = () => fixture.nativeElement as HTMLElement;
  const cabecera = () => el().querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  const cuerpo = () => el().querySelector<HTMLElement>('[id^="tarjeta-plegable-"]')!;
  const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AnfitrionComponent] }).compileComponents();
    fixture = TestBed.createComponent(AnfitrionComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('plegada muestra el título y el resumen, y sus campos están ocultos', () => {
    expect(el().textContent).toContain('Salud');
    expect(el().textContent).toContain('salud · número · 0–100');
    expect(cuerpo().hidden).toBeTrue();
    expect(cabecera().getAttribute('aria-expanded')).toBe('false');
  });

  it('los campos siguen en el DOM (conservan lo escrito) aunque estén ocultos', () => {
    const campo = el().querySelector<HTMLInputElement>('.campo')!;
    campo.value = '55';

    expect(cuerpo().contains(campo)).toBeTrue();
    expect(campo.value).toBe('55');
  });

  it('pulsar la línea pide abrir; abierta muestra los campos y ya no repite el resumen', () => {
    cabecera().click();
    refrescar();

    expect(host.abierta).toBeTrue();
    expect(cuerpo().hidden).toBeFalse();
    expect(cabecera().getAttribute('aria-expanded')).toBe('true');
    expect(el().textContent).not.toContain('salud · número · 0–100');
  });

  it('pulsarla otra vez la pliega', () => {
    cabecera().click(); refrescar();
    cabecera().click(); refrescar();

    expect(host.abierta).toBeFalse();
    expect(cuerpo().hidden).toBeTrue();
  });

  it('la cabecera apunta al cuerpo que controla (accesibilidad)', () => {
    expect(cabecera().getAttribute('aria-controls')).toBe(cuerpo().id);
  });

  it('las acciones se ven con la tarjeta plegada y no la abren ni la cierran', () => {
    const quitar = el().querySelector<HTMLButtonElement>('[aria-label="Quitar"]')!;

    quitar.click();
    refrescar();

    expect(host.quitado).toBeTrue();
    expect(host.abierta).toBeFalse();
    expect(el().querySelector('[aria-expanded]')!.contains(quitar)).toBeFalse();   // fuera del botón de la cabecera
  });

  it('avisa de lo que falta solo mientras está plegada', () => {
    host.advertencia = 'Falta el mensaje';
    refrescar();
    expect(el().querySelector('.badge-warning')?.getAttribute('title')).toBe('Falta el mensaje');

    host.abierta = true;
    refrescar();
    expect(el().querySelector('.badge-warning')).toBeNull();
  });

  it('se puede resaltar (la zona elegida en el escenario)', () => {
    expect(el().querySelector('.card')!.classList).not.toContain('ring-2');

    host.resaltada = true;
    refrescar();

    expect(el().querySelector('.card')!.classList).toContain('ring-2');
  });

  it('cada tarjeta tiene su propio id', () => {
    const otra = TestBed.createComponent(AnfitrionComponent);
    otra.detectChanges();

    expect(otra.nativeElement.querySelector('[id^="tarjeta-plegable-"]').id).not.toBe(cuerpo().id);
  });
});
