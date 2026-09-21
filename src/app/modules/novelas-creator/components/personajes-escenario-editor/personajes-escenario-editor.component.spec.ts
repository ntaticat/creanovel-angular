import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IPersonaje } from '@models/personaje.interfaces';
import { IPersonajeEnEscena } from '@models/recurso.interfaces';
import { PersonajesEscenarioEditorComponent } from './personajes-escenario-editor.component';

describe('PersonajesEscenarioEditorComponent', () => {
  let fixture: ComponentFixture<PersonajesEscenarioEditorComponent>;
  let editor: PersonajesEscenarioEditorComponent;
  let emitidos: IPersonajeEnEscena[][];
  const el = () => fixture.nativeElement as HTMLElement;

  const biblioteca: IPersonaje[] = [
    {
      personajeId: 'ana', nombre: 'Ana',
      sprites: [
        { personajeSpriteId: 's-feliz', nombre: 'feliz', direccionImagen: 'https://cdn.test/feliz.png' },
        { personajeSpriteId: 's-triste', nombre: 'triste', direccionImagen: 'https://cdn.test/triste.png' },
      ],
    },
    { personajeId: 'beto', nombre: 'Beto', sprites: [{ personajeSpriteId: 's-beto', nombre: 'normal', direccionImagen: 'https://cdn.test/beto.png' }] },
  ];
  const en = (personajeSpriteId: string, parcial: Partial<IPersonajeEnEscena> = {}): IPersonajeEnEscena =>
    ({ personajeSpriteId, x: 50, y: 50, escala: 1, espejo: false, ...parcial });

  /** Como el formulario padre: lo que emite el editor vuelve a entrar como `colocados`. */
  async function montar(colocados: IPersonajeEnEscena[] = [], fondoUrl: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [PersonajesEscenarioEditorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PersonajesEscenarioEditorComponent);
    editor = fixture.componentInstance;
    emitidos = [];
    editor.colocadosChange.subscribe(lista => {
      emitidos.push(lista);
      fixture.componentRef.setInput('colocados', lista);
      fixture.detectChanges();
    });
    fixture.componentRef.setInput('personajes', biblioteca);
    fixture.componentRef.setInput('colocados', colocados);
    fixture.componentRef.setInput('fondoUrl', fondoUrl);
    fixture.detectChanges();
  }
  const ultimo = () => emitidos[emitidos.length - 1];
  const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };

  it('ofrece todos los sprites de la novela para añadir', async () => {
    await montar();

    expect(editor.disponibles.map(s => `${s.personajeNombre} — ${s.nombre}`)).toEqual(['Ana — feliz', 'Ana — triste', 'Beto — normal']);
    expect(el().textContent).toContain('0 de 8');
  });

  it('sin personajes en la novela lo dice', async () => {
    await montar();
    fixture.componentRef.setInput('personajes', []);
    fixture.detectChanges();

    expect(el().textContent).toContain('todavía no tiene personajes con sprites');
  });

  describe('añadir', () => {
    it('añade el sprite centrado y entero, y lo deja seleccionado', async () => {
      await montar();

      editor.agregar(editor.disponibles[0]);

      expect(ultimo()).toEqual([{ personajeSpriteId: 's-feliz', x: 50, y: 50, escala: 0.9, espejo: false }]);
      expect(editor.seleccionado).toBe(0);
    });

    it('permite varios personajes (y varios sprites del mismo) y los reparte para que no se tapen', async () => {
      await montar();

      editor.agregar(editor.disponibles[0]);
      editor.agregar(editor.disponibles[1]);
      editor.agregar(editor.disponibles[2]);

      expect(ultimo().map(p => [p.personajeSpriteId, p.x])).toEqual([['s-feliz', 50], ['s-triste', 25], ['s-beto', 75]]);
    });

    it('no pasa del máximo de personajes por escenario', async () => {
      await montar(Array.from({ length: 8 }, () => en('s-beto')));

      editor.agregar(editor.disponibles[0]);

      expect(emitidos.length).toBe(0);
      expect(editor.puedeAgregar).toBeFalse();
      expect(el().textContent).toContain('8 de 8');
    });
  });

  describe('editar lo colocado', () => {
    it('cambiar el tamaño respeta los límites', async () => {
      await montar([en('s-beto')]);

      editor.cambiarEscala(0, '2.5');
      expect(ultimo()[0].escala).toBe(2.5);

      editor.cambiarEscala(0, '99');
      expect(ultimo()[0].escala).toBe(4);
    });

    it('un tamaño que no es un número se ignora', async () => {
      await montar([en('s-beto')]);

      editor.cambiarEscala(0, 'abc');

      expect(emitidos.length).toBe(0);
    });

    it('voltear solo cambia el espejo', async () => {
      await montar([en('s-beto', { x: 30, escala: 1.2 })]);

      editor.cambiarEspejo(0, true);

      expect(ultimo()[0]).toEqual({ personajeSpriteId: 's-beto', x: 30, y: 50, escala: 1.2, espejo: true });
    });

    it('quitar borra solo ese personaje', async () => {
      await montar([en('s-feliz'), en('s-beto'), en('s-triste')]);

      editor.quitar(1);

      expect(ultimo().map(p => p.personajeSpriteId)).toEqual(['s-feliz', 's-triste']);
    });

    it('traer al frente y enviar atrás cambian el orden de apilado, y el seleccionado los sigue', async () => {
      await montar([en('s-feliz'), en('s-beto'), en('s-triste')]);

      editor.apilar(0, 1);
      expect(ultimo().map(p => p.personajeSpriteId)).toEqual(['s-beto', 's-feliz', 's-triste']);
      expect(editor.seleccionado).toBe(1);

      editor.apilar(1, -1);
      expect(ultimo().map(p => p.personajeSpriteId)).toEqual(['s-feliz', 's-beto', 's-triste']);

      const antes = emitidos.length;
      editor.apilar(0, -1);   // ya está al fondo
      editor.apilar(2, 1);    // ya está al frente
      expect(emitidos.length).toBe(antes);
    });
  });

  describe('en el escenario', () => {
    const arrastrarUnPorcentaje = (indice: number, dx: number, dy: number) => {
      // Escenario simulado de 400 x 225 px en el origen
      spyOn(editor.escenario.nativeElement, 'getBoundingClientRect').and.returnValue({ left: 0, top: 0, width: 400, height: 225 } as DOMRect);
      spyOn(editor.escenario.nativeElement, 'setPointerCapture');
      editor.iniciarMover({ button: 0, clientX: 200, clientY: 100, pointerId: 1, stopPropagation() {} } as unknown as PointerEvent, indice);
      editor.arrastrar({ clientX: 200 + (dx / 100) * 400, clientY: 100 + (dy / 100) * 225 } as PointerEvent);
    };

    it('arrastrar mueve el centro del sprite en % del escenario', async () => {
      await montar([en('s-beto', { x: 50, y: 50 })]);

      arrastrarUnPorcentaje(0, 10, -20);

      expect(ultimo()[0].x).toBe(60);
      expect(ultimo()[0].y).toBe(30);
      expect(editor.seleccionado).toBe(0);
    });

    it('arrastrar no saca el centro del escenario y el arrastre termina al soltar', async () => {
      await montar([en('s-beto', { x: 90, y: 50 })]);

      arrastrarUnPorcentaje(0, 40, 0);
      expect(ultimo()[0].x).toBe(100);

      editor.soltar();
      const antes = emitidos.length;
      editor.arrastrar({ clientX: 0, clientY: 0 } as PointerEvent);
      expect(emitidos.length).toBe(antes);
    });

    it('la rueda agranda hacia arriba y achica hacia abajo, sin desplazar la página', async () => {
      await montar([en('s-beto', { escala: 1 })]);
      const evento = (deltaY: number) => ({ deltaY, preventDefault: jasmine.createSpy('preventDefault') }) as unknown as WheelEvent;

      const subir = evento(-100);
      editor.rueda(subir, 0);
      expect(ultimo()[0].escala).toBeGreaterThan(1);
      expect(subir.preventDefault).toHaveBeenCalled();

      editor.rueda(evento(100), 0);
      editor.rueda(evento(100), 0);
      expect(ultimo()[0].escala).toBeLessThan(1);
    });

    it('el teclado mueve con las flechas (Alt = paso fino), cambia el tamaño con + y − y quita con Supr', async () => {
      await montar([en('s-beto')]);
      const tecla = (key: string, extra = {}) => ({ key, preventDefault() {}, ...extra }) as unknown as KeyboardEvent;

      editor.teclado(tecla('ArrowRight'), 0);
      expect(ultimo()[0].x).toBe(51);
      editor.teclado(tecla('ArrowUp', { altKey: true }), 0);
      expect(ultimo()[0].y).toBe(49.5);
      editor.teclado(tecla('+'), 0);
      expect(ultimo()[0].escala).toBeGreaterThan(1);
      editor.teclado(tecla('-'), 0);
      editor.teclado(tecla('-'), 0);
      expect(ultimo()[0].escala).toBeLessThan(1);
      editor.teclado(tecla('Delete'), 0);
      expect(ultimo()).toEqual([]);
    });

    it('cada personaje se dibuja con el mismo estilo que el escenario del jugador', async () => {
      await montar([en('s-beto', { x: 25, y: 80, escala: 1.5, espejo: true })]);
      refrescar();

      const imagen = el().querySelector<HTMLImageElement>('[role=group] img')!;
      expect(imagen.classList).toContain('object-contain');
      expect((imagen.parentElement as HTMLElement).style.transform).toBe('translate(-25%, 30%) scale(-1.5, 1.5)');
    });
  });

  it('un sprite que ya no está en la novela se lista con aviso, no se dibuja y se puede quitar', async () => {
    await montar([en('s-fantasma'), en('s-beto')]);

    expect(el().textContent).toContain('Sprite que ya no está en la novela');
    expect(el().querySelectorAll('[role=group] img').length).toBe(1);

    editor.quitar(0);
    expect(ultimo().map(p => p.personajeSpriteId)).toEqual(['s-beto']);
  });

  describe('zona donde se puede arrastrar un sprite', () => {
    const cargar = (indice: number, ancho: number, alto: number) => {
      const imagen = el().querySelectorAll<HTMLImageElement>('[role=group] img')[indice];
      Object.defineProperty(imagen, 'naturalWidth', { value: ancho });
      Object.defineProperty(imagen, 'naturalHeight', { value: alto });
      imagen.dispatchEvent(new Event('load'));
      fixture.detectChanges();
      return imagen;
    };

    it('mientras no se conoce la proporción de la imagen la ajusta el navegador', async () => {
      await montar([en('s-beto')]);

      const imagen = el().querySelector<HTMLImageElement>('[role=group] img')!;
      expect(imagen.classList).toContain('h-full');
      expect(imagen.style.width).toBe('');
    });

    it('al cargar, la caja pasa a ser justo la del sprite entero: uno alto no ocupa más que su ancho', async () => {
      await montar([en('s-beto')]);

      const imagen = cargar(0, 300, 600);

      expect(imagen.style.height).toBe('100%');
      expect(imagen.style.width).toBe('28.13%');
    });

    it('uno más ancho que el escenario no tapa con una caja transparente lo que hay debajo', async () => {
      await montar([en('s-beto'), en('s-feliz')]);

      const ancho = cargar(1, 600, 300);

      expect(ancho.style.width).toBe('100%');
      expect(ancho.style.height).toBe('88.89%');   // sobra alto: ese espacio libre queda accesible
    });
  });

  it('muestra el fondo del nodo detrás de los personajes', async () => {
    await montar([], 'https://cdn.test/fondo.png');

    expect(el().querySelector<HTMLElement>('[role=group]')!.style.backgroundImage).toContain('fondo.png');
  });
});
