import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovelaStageComponent } from './novela-stage.component';

describe('NovelaStageComponent — pantalla completa', () => {
  let fixture: ComponentFixture<NovelaStageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const boton = () => el().querySelector<HTMLButtonElement>('button[aria-label$="antalla completa"]');
  const raiz = () => el().firstElementChild as HTMLElement;

  async function montar(permitir = true) {
    await TestBed.configureTestingModule({ imports: [NovelaStageComponent] }).compileComponents();
    fixture = TestBed.createComponent(NovelaStageComponent);
    fixture.componentRef.setInput('permitirPantallaCompleta', permitir);
    fixture.detectChanges();
  }

  async function pulsar() {
    boton()!.click();
    // El componente espera a la API del navegador (promesas) antes de terminar de entrar/salir.
    await fixture.whenStable();
    await Promise.resolve();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  it('no ofrece el botón si el host no lo pide (el signup)', async () => {
    await montar(false);

    expect(boton()).toBeNull();
  });

  describe('sin API nativa (capa fija)', () => {
    beforeEach(async () => {
      await montar();
      // El navegador no implementa requestFullscreen (iPhone).
      (raiz() as { requestFullscreen?: unknown }).requestFullscreen = undefined;
    });

    it('cubre la ventana y vuelve al diseño normal al salir', async () => {
      expect(raiz().className).toContain('relative');

      await pulsar();
      expect(raiz().className).toContain('fixed');
      expect(raiz().className).not.toContain('relative');
      expect(boton()!.getAttribute('aria-label')).toBe('Salir de pantalla completa');

      await pulsar();
      expect(raiz().className).toContain('relative');
      expect(boton()!.getAttribute('aria-label')).toBe('Pantalla completa');
    });

    it('Esc la cierra', async () => {
      await pulsar();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(raiz().className).not.toContain('fixed');
    });

    it('el escenario se mantiene en 16:9 aunque el nodo no lo fije', async () => {
      expect(el().querySelector('.aspect-\\[4\\/5\\]')).not.toBeNull();

      await pulsar();

      expect(el().querySelector('.aspect-\\[4\\/5\\]')).toBeNull();
      expect(el().querySelector('.aspect-video')).not.toBeNull();
    });
  });

  describe('con la API nativa', () => {
    let bloqueo: jasmine.Spy;
    let desbloqueo: jasmine.Spy;
    let tactil: boolean;
    let elementoNativo: Element | null;

    beforeEach(async () => {
      tactil = true;
      elementoNativo = null;
      bloqueo = jasmine.createSpy('lock').and.resolveTo();
      desbloqueo = jasmine.createSpy('unlock');
      spyOn(window, 'matchMedia').and.callFake(
        (consulta: string) => ({ matches: tactil && consulta.includes('coarse') }) as MediaQueryList,
      );
      spyOnProperty(document, 'fullscreenElement', 'get').and.callFake(() => elementoNativo);
      spyOn(document, 'exitFullscreen').and.callFake(async () => {
        elementoNativo = null;
      });
      Object.defineProperty(screen, 'orientation', {
        configurable: true,
        value: { lock: bloqueo, unlock: desbloqueo },
      });
      await montar();
      (raiz() as unknown as { requestFullscreen: () => Promise<void> }).requestFullscreen = async () => {
        elementoNativo = raiz();
      };
    });

    afterEach(() => {
      // `screen.orientation` es una propiedad del prototipo: quitar la del objeto deja la real.
      delete (screen as { orientation?: unknown }).orientation;
    });

    it('en un móvil fija la orientación horizontal y la suelta al salir', async () => {
      await pulsar();

      expect(bloqueo).toHaveBeenCalledOnceWith('landscape');

      await pulsar();

      expect(desbloqueo).toHaveBeenCalled();
      expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it('con ratón no toca la orientación', async () => {
      tactil = false;

      await pulsar();

      expect(bloqueo).not.toHaveBeenCalled();
    });

    it('si el navegador no deja fijarla, pide girar el teléfono', async () => {
      bloqueo.and.rejectWith(new DOMException('no', 'NotSupportedError'));

      await pulsar();

      expect(fixture.componentInstance.sugerirGirar).toBeTrue();
      expect(el().textContent).toContain('Gira el teléfono');
    });

    it('si el jugador sale con el gesto del navegador se limpia el estado', async () => {
      await pulsar();

      elementoNativo = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      await fixture.whenStable();
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(raiz().className).not.toContain('fixed');
      expect(desbloqueo).toHaveBeenCalled();
    });
  });
});
