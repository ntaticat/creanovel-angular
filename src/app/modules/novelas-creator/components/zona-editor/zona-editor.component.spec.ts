import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IRegion } from '@models/motor.interfaces';
import { ZonaEditorComponent } from './zona-editor.component';

describe('ZonaEditorComponent', () => {
  let fixture: ComponentFixture<ZonaEditorComponent>;
  let component: ZonaEditorComponent;
  let escenario: HTMLElement;

  // El escenario mide 400x225 y empieza en (100, 50): 1 % horizontal = 4 px, 1 % vertical = 2,25 px.
  const px = (xPct: number, yPct: number) => ({ clientX: 100 + xPct * 4, clientY: 50 + yPct * 2.25 });
  const puntero = (tipo: string, xPct: number, yPct: number, destino: HTMLElement = escenario) =>
    destino.dispatchEvent(new PointerEvent(tipo, { bubbles: true, button: 0, pointerId: 1, ...px(xPct, yPct) }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ZonaEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(ZonaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    escenario = component.escenario.nativeElement;
    spyOn(escenario, 'getBoundingClientRect').and.returnValue(
      { left: 100, top: 50, width: 400, height: 225, right: 500, bottom: 275, x: 100, y: 50, toJSON: () => ({}) } as DOMRect
    );
  });

  it('arrastrar sobre el escenario dibuja una zona, en cualquier dirección', () => {
    const creadas: IRegion[] = [];
    component.zonaCreada.subscribe(r => creadas.push(r));

    puntero('pointerdown', 60, 40);
    puntero('pointermove', 30, 20);
    puntero('pointerup', 30, 20);

    expect(creadas).toEqual([{ x: 30, y: 20, ancho: 30, alto: 20 }]);
  });

  it('un clic o un arrastre diminuto no crea una zona', () => {
    const creadas: IRegion[] = [];
    component.zonaCreada.subscribe(r => creadas.push(r));

    puntero('pointerdown', 50, 50);
    puntero('pointerup', 50, 50);
    puntero('pointerdown', 50, 50);
    puntero('pointermove', 51, 51);
    puntero('pointerup', 51, 51);

    expect(creadas).toEqual([]);
  });

  it('mientras se arrastra se ve el borrador de la zona y al soltar desaparece', () => {
    puntero('pointerdown', 10, 10);
    puntero('pointermove', 40, 30);
    fixture.detectChanges();
    expect(component.borrador).toEqual({ x: 10, y: 10, ancho: 30, alto: 20 });
    expect(fixture.nativeElement.querySelector('.border-dashed')).not.toBeNull();

    puntero('pointerup', 40, 30);
    fixture.detectChanges();
    expect(component.borrador).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.border-dashed')).toBeNull();
  });

  describe('con una zona existente', () => {
    const region: IRegion = { x: 20, y: 20, ancho: 30, alto: 30 };
    let cambios: { indice: number; region: IRegion }[];
    let seleccionadas: number[];

    beforeEach(() => {
      fixture.componentRef.setInput('zonas', [{ etiqueta: 'Cofre', region }]);
      cambios = [];
      seleccionadas = [];
      component.regionCambiada.subscribe(c => cambios.push(c));
      component.seleccionar.subscribe(i => seleccionadas.push(i));
      fixture.detectChanges();
    });

    const zona = () => fixture.nativeElement.querySelector('[role=button]') as HTMLElement;

    it('se dibuja con su región en % y su nombre', () => {
      expect(zona().style.left).toBe('20%');
      expect(zona().style.width).toBe('30%');
      expect(zona().textContent).toContain('Cofre');
    });

    it('arrastrarla la mueve por la diferencia y la selecciona', () => {
      puntero('pointerdown', 30, 30, zona());
      puntero('pointermove', 40, 35);
      puntero('pointerup', 40, 35);

      expect(seleccionadas).toContain(0);
      expect(cambios[cambios.length - 1]).toEqual({ indice: 0, region: { x: 30, y: 25, ancho: 30, alto: 30 } });
    });

    it('mover una zona no crea otra (el arrastre no se propaga al escenario)', () => {
      const creadas: IRegion[] = [];
      component.zonaCreada.subscribe(r => creadas.push(r));

      puntero('pointerdown', 30, 30, zona());
      puntero('pointermove', 60, 60);
      puntero('pointerup', 60, 60);

      expect(creadas).toEqual([]);
    });

    it('la esquina cambia el tamaño', () => {
      const esquina = zona().querySelector('[aria-hidden=true]') as HTMLElement;

      puntero('pointerdown', 50, 50, esquina);
      puntero('pointermove', 60, 55);
      puntero('pointerup', 60, 55);

      expect(cambios[cambios.length - 1].region).toEqual({ x: 20, y: 20, ancho: 40, alto: 35 });
    });

    it('la zona no sale del escenario al arrastrarla', () => {
      puntero('pointerdown', 30, 30, zona());
      puntero('pointermove', 100, 100);
      puntero('pointerup', 100, 100);

      const final = cambios[cambios.length - 1].region;
      expect(final.x + final.ancho).toBeLessThanOrEqual(100);
      expect(final.y + final.alto).toBeLessThanOrEqual(100);
    });

    it('las flechas la mueven y Mayús+flechas cambian su tamaño', () => {
      zona().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(cambios[0].region.x).toBe(21);

      zona().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true }));
      expect(cambios[1].region.alto).toBe(31);
    });

    it('otras teclas no hacen nada', () => {
      zona().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

      expect(cambios).toEqual([]);
    });

    it('enfocarla la selecciona', () => {
      zona().dispatchEvent(new FocusEvent('focus'));

      expect(seleccionadas).toEqual([0]);
    });
  });

  it('sin fondo avisa de que hay que elegir uno', () => {
    expect(fixture.nativeElement.textContent).toContain('Elige un fondo');

    fixture.componentRef.setInput('fondoUrl', 'http://x/y.png');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Elige un fondo');
    expect(escenario.style.backgroundImage).toContain('y.png');
  });
  describe('personajes del nodo', () => {
    const vista = (nombre: string, parcial = {}) => ({
      personajeSpriteId: nombre, nombre, url: `http://x/${nombre}.png`, x: 50, y: 50, escala: 1, espejo: false, ...parcial,
    });
    const imagenes = () => Array.from(fixture.nativeElement.querySelectorAll('[role=group] img')) as HTMLImageElement[];

    it('sin personajes no dibuja ninguna imagen', () => {
      expect(imagenes().length).toBe(0);
    });

    it('los dibuja enteros y colocados como en el escenario del jugador, detrás de las zonas', () => {
      fixture.componentRef.setInput('personajes', [vista('ana', { x: 25, y: 80, escala: 1.5, espejo: true }), vista('beto')]);
      fixture.componentRef.setInput('zonas', [{ etiqueta: 'Puerta', region: { x: 10, y: 10, ancho: 20, alto: 20 } }]);
      fixture.detectChanges();

      expect(imagenes().map(i => i.getAttribute('src'))).toEqual(['http://x/ana.png', 'http://x/beto.png']);
      expect(imagenes()[0].classList).toContain('object-contain');
      expect((imagenes()[0].parentElement as HTMLElement).style.transform).toBe('translate(-25%, 30%) scale(-1.5, 1.5)');

      // Las zonas van después en el DOM: se dibujan encima de los personajes
      const zona = escenario.querySelector('[role=button]') as HTMLElement;
      const ultimoPersonaje = imagenes()[1].parentElement as HTMLElement;
      expect(ultimoPersonaje.compareDocumentPosition(zona) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('no capturan el ratón: se puede dibujar y mover una zona encima de un personaje', () => {
      fixture.componentRef.setInput('personajes', [vista('ana')]);
      fixture.detectChanges();
      expect(imagenes()[0].parentElement!.classList).toContain('pointer-events-none');

      const creadas: IRegion[] = [];
      component.zonaCreada.subscribe(r => creadas.push(r));
      puntero('pointerdown', 40, 40);
      puntero('pointermove', 60, 60);
      puntero('pointerup', 60, 60);

      expect(creadas).toEqual([{ x: 40, y: 40, ancho: 20, alto: 20 }]);
    });

    it('son decorativos para lectores de pantalla', () => {
      fixture.componentRef.setInput('personajes', [vista('ana')]);
      fixture.detectChanges();

      expect(imagenes()[0].getAttribute('aria-hidden')).toBe('true');
    });
  });
});
