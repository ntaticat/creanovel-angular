import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActualizacionPwaService, AvisoPwa } from 'src/app/shared/services/actualizacion-pwa.service';
import { AvisoActualizacionComponent } from './aviso-actualizacion.component';

describe('AvisoActualizacionComponent', () => {
  let fixture: ComponentFixture<AvisoActualizacionComponent>;
  let aviso: ReturnType<typeof signal<AvisoPwa | null>>;
  let servicio: { aviso: typeof aviso; actualizar: jasmine.Spy; descartar: jasmine.Spy };
  const el = () => fixture.nativeElement as HTMLElement;
  const botones = () => Array.from(el().querySelectorAll('button')).map(b => b.textContent?.trim());

  beforeEach(async () => {
    aviso = signal<AvisoPwa | null>(null);
    servicio = { aviso, actualizar: jasmine.createSpy('actualizar'), descartar: jasmine.createSpy('descartar') };
    await TestBed.configureTestingModule({
      imports: [AvisoActualizacionComponent],
      providers: [{ provide: ActualizacionPwaService, useValue: servicio }],
    }).compileComponents();
    fixture = TestBed.createComponent(AvisoActualizacionComponent);
    fixture.detectChanges();
  });

  it('no dibuja nada si no hay aviso', () => {
    expect(el().querySelector('[role="status"]')).toBeNull();
  });

  it('con una versión nueva ofrece actualizar o dejarlo para luego', () => {
    aviso.set('nueva-version');
    fixture.detectChanges();

    expect(el().querySelector('[role="status"]')?.textContent).toContain('versión nueva');
    expect(botones()).toEqual(['Actualizar', 'Luego']);

    el().querySelectorAll('button')[0].click();
    el().querySelectorAll('button')[1].click();
    expect(servicio.actualizar).toHaveBeenCalledTimes(1);
    expect(servicio.descartar).toHaveBeenCalledTimes(1);
  });

  it('si la app se desincronizó solo ofrece recargar (no se puede aplazar)', () => {
    aviso.set('desincronizada');
    fixture.detectChanges();

    expect(botones()).toEqual(['Recargar']);
  });
});
