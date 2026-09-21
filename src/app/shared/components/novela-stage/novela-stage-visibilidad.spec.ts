import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IHudItem, IItemMochila } from 'src/app/shared/engine/motor';
import { NovelaStageComponent } from './novela-stage.component';

describe('NovelaStageComponent — HUD y mochila a la vista', () => {
  let fixture: ComponentFixture<NovelaStageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const objeto = (parcial: Partial<IItemMochila>): IItemMochila => ({
    id: 'llave', nombre: 'Llave', descripcion: '', cantidad: 1, apilable: false, ...parcial,
  });
  const hud: IHudItem[] = [{ clave: 'salud', etiqueta: 'Salud', valor: 80, tipo: 'numero' } as IHudItem];
  const botonHud = () => el().querySelector<HTMLButtonElement>('button[aria-label$="ubicación y estadísticas"]');
  const fichas = () => Array.from(el().querySelectorAll<HTMLButtonElement>('ul li button'));

  async function montar(entradas: Record<string, unknown>) {
    await TestBed.configureTestingModule({ imports: [NovelaStageComponent] }).compileComponents();
    fixture = TestBed.createComponent(NovelaStageComponent);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    fixture.detectChanges();
  }

  function pulsar(boton: HTMLElement) {
    boton.click();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  describe('botón para ocultar el HUD', () => {
    it('no aparece si no hay nada que ocultar', async () => {
      await montar({});

      expect(botonHud()).toBeNull();
    });

    it('oculta y vuelve a mostrar la ubicación y los stats', async () => {
      await montar({ hud, ubicacionNombre: 'Plaza' });
      expect(el().textContent).toContain('Plaza');
      expect(el().textContent).toContain('Salud');

      pulsar(botonHud()!);
      expect(el().textContent).not.toContain('Plaza');
      expect(el().textContent).not.toContain('Salud');
      expect(botonHud()!.getAttribute('aria-pressed')).toBe('true');
      expect(botonHud()!.getAttribute('aria-label')).toContain('Mostrar');

      pulsar(botonHud()!);
      expect(el().textContent).toContain('Plaza');
      expect(el().textContent).toContain('Salud');
      expect(botonHud()!.getAttribute('aria-pressed')).toBe('false');
    });

    it('sigue oculto cuando cambian los datos del siguiente nodo', async () => {
      await montar({ hud, ubicacionNombre: 'Plaza' });
      pulsar(botonHud()!);

      fixture.componentRef.setInput('ubicacionNombre', 'Bosque');
      fixture.detectChanges();

      expect(el().textContent).not.toContain('Bosque');
    });
  });

  describe('mochila siempre visible', () => {
    it('muestra una ficha por objeto, con su cantidad si es apilable', async () => {
      await montar({
        mostrarMochila: true,
        mochila: [objeto({}), objeto({ id: 'pocion', nombre: 'Poción', cantidad: 3, apilable: true })],
      });

      expect(fichas().length).toBe(2);
      expect(fichas()[0].getAttribute('aria-label')).toBe('Llave');
      expect(fichas()[1].getAttribute('aria-label')).toBe('Poción ×3');
      expect(fichas()[1].textContent).toContain('3');
    });

    it('sin imagen dibuja la inicial del objeto; con imagen, la imagen', async () => {
      await montar({
        mostrarMochila: true,
        mochila: [objeto({}), objeto({ id: 'mapa', nombre: 'mapa', imagenUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' })],
      });

      expect(fichas()[0].querySelector('img')).toBeNull();
      expect(fichas()[0].textContent).toContain('L');
      expect(fichas()[1].querySelector('img')?.getAttribute('src')).toBe('data:image/gif;base64,R0lGODlhAQABAAAAACw=');
    });

    it('con la mochila vacía lo dice en lugar de dejar un hueco', async () => {
      await montar({ mostrarMochila: true, mochila: [] });

      expect(fichas().length).toBe(0);
      expect(el().textContent).toContain('vacía');
    });

    it('pulsar una ficha abre el detalle de la mochila (y no lo cierra si ya estaba abierto)', async () => {
      await montar({ mostrarMochila: true, mochila: [objeto({})] });
      expect(el().querySelector('[role="dialog"]')).toBeNull();

      pulsar(fichas()[0]);
      expect(fixture.componentInstance.mochilaAbierta).toBeTrue();
      expect(el().querySelector('[role="dialog"][aria-label="Mochila"]')).not.toBeNull();
    });

    it('marca los objetos que se pueden usar ahora mismo', async () => {
      await montar({
        mostrarMochila: true,
        mochila: [
          objeto({ uso: { etiqueta: 'Usar', habilitado: true, llevaANodo: false } }),
          objeto({ id: 'b', nombre: 'Bloqueada', uso: { etiqueta: 'Usar', habilitado: false, llevaANodo: false } }),
        ],
      });

      expect(fichas()[0].querySelector('[title="Se puede usar"]')).not.toBeNull();
      expect(fichas()[1].querySelector('[title="Se puede usar"]')).toBeNull();
    });

    it('no dibuja la tira si la novela no tiene objetos', async () => {
      await montar({ mostrarMochila: false, mochila: [] });

      expect(el().querySelector('[aria-label="Objetos que llevas"]')).toBeNull();
    });
  });
});
