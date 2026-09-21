import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMinijuegoConfig, IResultadoMinijuego } from '@models/motor.interfaces';
import { MINIJUEGO_ALEATORIO, MINIJUEGO_RELOJ, MinijuegoComponent } from './minijuego.component';

describe('MinijuegoComponent', () => {
  let fixture: ComponentFixture<MinijuegoComponent>;
  let component: MinijuegoComponent;
  let ahora: number;
  let resultados: IResultadoMinijuego[];

  const CLAVE_PREFERENCIA = 'creanovel.minijuegos.mas-tiempo';

  async function montar(config: IMinijuegoConfig, azar = 0.5) {
    ahora = 0;
    resultados = [];
    await TestBed.configureTestingModule({
      imports: [MinijuegoComponent],
      providers: [
        { provide: MINIJUEGO_RELOJ, useValue: () => ahora },
        { provide: MINIJUEGO_ALEATORIO, useValue: () => azar },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MinijuegoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('mensaje', '¡Rápido!');
    component.terminado.subscribe(r => resultados.push(r));
    fixture.detectChanges();
  }

  const tecla = (key: string, init: KeyboardEventInit = {}) =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  const el = () => fixture.nativeElement as HTMLElement;
  // Llamar métodos del componente directamente no marca su vista como sucia en las pruebas (en la app, zone.js sí dispara la detección).
  const detectar = () => {
    fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
    fixture.detectChanges();
  };
  const boton = (texto: string) => Array.from(el().querySelectorAll('button')).find(b => b.textContent?.includes(texto)) as HTMLButtonElement;

  beforeEach(() => localStorage.removeItem(CLAVE_PREFERENCIA));
  afterEach(() => localStorage.removeItem(CLAVE_PREFERENCIA));

  describe('pulsaciones', () => {
    const config: IMinijuegoConfig = { tipo: 'pulsaciones', objetivo: 3, tiempoMs: 2000 };
    beforeEach(() => montar(config));

    it('empieza en "listo" con las instrucciones y el mensaje del nodo', () => {
      expect(component.fase).toBe('listo');
      expect(el().textContent).toContain('¡Rápido!');
      expect(el().textContent).toContain('Pulsa lo más rápido');
      expect(boton('Empezar')).toBeTruthy();
    });

    it('las teclas no hacen nada hasta empezar', () => {
      tecla(' ');

      expect(component.estadoPulsaciones).toBeUndefined();
    });

    it('Empezar pasa a jugando y las pulsaciones de teclado cuentan', () => {
      boton('Empezar').click();
      detectar();
      expect(component.fase).toBe('jugando');

      tecla(' ');
      tecla('Enter');

      expect(component.estadoPulsaciones?.cuenta).toBe(2);
    });

    it('mantener una tecla pulsada no cuenta como varias pulsaciones', () => {
      component.empezar();

      tecla(' ');
      tecla(' ', { repeat: true });
      tecla(' ', { repeat: true });

      expect(component.estadoPulsaciones?.cuenta).toBe(1);
    });

    it('las combinaciones con Ctrl, Meta o Alt se ignoran (no pisan atajos del navegador)', () => {
      component.empezar();

      tecla(' ', { ctrlKey: true });
      tecla('Enter', { metaKey: true });
      tecla(' ', { altKey: true });

      expect(component.estadoPulsaciones?.cuenta).toBe(0);
    });

    it('Espacio no desplaza la página mientras se juega', () => {
      component.empezar();
      const evento = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

      document.dispatchEvent(evento);

      expect(evento.defaultPrevented).toBeTrue();
    });

    it('llegar al objetivo muestra el resultado y "Continuar" lo emite', () => {
      component.empezar();
      ahora = 500;
      tecla(' '); tecla(' '); tecla(' ');
      detectar();

      expect(component.fase).toBe('fin');
      expect(el().textContent).toContain('Lo lograste');
      expect(resultados).toEqual([]);           // hasta que el jugador continúe

      boton('Continuar').click();

      expect(resultados).toEqual([{ exito: true, puntaje: 3 }]);
    });

    it('si se acaba el tiempo es un fallo con lo que llevaba', () => {
      component.empezar();
      tecla(' ');
      ahora = 2000;
      component.tick(ahora);
      detectar();

      expect(component.fase).toBe('fin');
      expect(component.resultado).toEqual({ exito: false, puntaje: 1 });
      expect(el().textContent).toContain('No salió esta vez');
    });

    it('omitir emite éxito con el puntaje máximo sin pasar por el resultado', () => {
      boton('Omitir').click();

      expect(resultados).toEqual([{ exito: true, puntaje: 3 }]);
    });

    it('omitir también funciona a mitad de partida', () => {
      component.empezar();
      detectar();
      tecla(' ');

      boton('Omitir').click();

      expect(resultados).toEqual([{ exito: true, puntaje: 3 }]);
    });

    it('cambiar la configuración reinicia el minijuego', () => {
      component.empezar();
      tecla(' ');

      fixture.componentRef.setInput('config', { tipo: 'pulsaciones', objetivo: 10, tiempoMs: 5000 });
      detectar();

      expect(component.fase).toBe('listo');
      expect(component.estadoPulsaciones).toBeUndefined();
    });

    it('anuncia el resultado a los lectores de pantalla', () => {
      component.empezar();
      tecla(' '); tecla(' '); tecla(' ');
      detectar();

      expect(el().querySelector('[aria-live=polite]')?.textContent).toContain('Lo lograste');
    });

    it('dejar de mostrar el componente detiene el reloj (no queda un bucle vivo)', () => {
      component.empezar();
      const cancelar = spyOn(window, 'cancelAnimationFrame').and.callThrough();

      fixture.destroy();

      expect(cancelar).toHaveBeenCalled();
    });
  });

  describe('más tiempo', () => {
    const config: IMinijuegoConfig = { tipo: 'pulsaciones', objetivo: 3, tiempoMs: 2000 };

    it('por defecto está desactivado y la partida dura lo configurado', async () => {
      await montar(config);
      component.empezar();

      expect(component.masTiempo).toBeFalse();
      expect(component.estadoPulsaciones?.limiteMs).toBe(2000);
    });

    it('al activarlo alarga el tiempo x2,5 y se recuerda para la próxima vez', async () => {
      await montar(config);
      component.cambiarMasTiempo(true);
      component.empezar();

      expect(component.estadoPulsaciones?.limiteMs).toBe(5000);
      expect(localStorage.getItem(CLAVE_PREFERENCIA)).toBe('1');

      // Otro minijuego nuevo arranca ya con la preferencia
      fixture.destroy();
      fixture = TestBed.createComponent(MinijuegoComponent);
      fixture.componentRef.setInput('config', config);
      detectar();
      expect(fixture.componentInstance.masTiempo).toBeTrue();
    });

    it('la casilla de la pantalla de inicio lo activa', async () => {
      await montar(config);

      const casilla = el().querySelector('input[type=checkbox]') as HTMLInputElement;
      casilla.checked = true;
      casilla.dispatchEvent(new Event('change'));
      component.empezar();

      expect(component.estadoPulsaciones?.limiteMs).toBe(5000);
    });
  });

  describe('secuencia', () => {
    // Con aleatorio() = 0.1 todas las flechas son "izquierda".
    const config: IMinijuegoConfig = { tipo: 'secuencia', longitud: 3, tiempoMs: 4000 };
    beforeEach(() => montar(config, 0.1));

    it('las flechas del teclado avanzan la secuencia y la completan', () => {
      component.empezar();
      detectar();
      expect(el().querySelectorAll('ol li').length).toBe(3);

      tecla('ArrowLeft'); tecla('ArrowLeft'); tecla('ArrowLeft');

      expect(component.resultado).toEqual({ exito: true, puntaje: 3 });
    });

    it('una flecha equivocada termina el intento', () => {
      component.empezar();

      tecla('ArrowLeft');
      tecla('ArrowUp');

      expect(component.resultado).toEqual({ exito: false, puntaje: 1 });
    });

    it('otras teclas no cuentan ni como error', () => {
      component.empezar();

      tecla('a'); tecla('Enter'); tecla(' ');

      expect(component.estadoSecuencia?.indice).toBe(0);
      expect(component.fase).toBe('jugando');
    });

    it('los botones en pantalla también funcionan (pantallas táctiles)', () => {
      component.empezar();
      detectar();
      const izquierda = el().querySelector('button[aria-label=izquierda]') as HTMLButtonElement;

      izquierda.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      expect(component.estadoSecuencia?.indice).toBe(1);
    });

    it('anuncia cuántas flechas quedan', () => {
      component.empezar();
      tecla('ArrowLeft');
      detectar();

      expect(component.anuncio).toContain('Quedan 2');
    });

    it('la barra de tiempo baja con el reloj', () => {
      component.empezar();
      ahora = 1000;
      component.tick(ahora);

      expect(component.tiempoRestante).toBeCloseTo(0.75, 5);
    });
  });

  describe('reflejo', () => {
    const config: IMinijuegoConfig = { tipo: 'reflejo', objetivos: 2, aciertosNecesarios: 2, duracionMs: 1000 };
    beforeEach(() => montar(config));

    it('pulsar el objetivo visible suma un acierto; ganar todos es éxito', () => {
      component.empezar();
      detectar();
      const objetivo = () => el().querySelector('button[aria-label^="Objetivo"]') as HTMLButtonElement;

      objetivo().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      detectar();
      objetivo().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

      expect(component.resultado).toEqual({ exito: true, puntaje: 2 });
    });

    it('con el teclado, Espacio cuenta como pulsar el objetivo', () => {
      component.empezar();

      tecla(' ');
      tecla('Enter');

      expect(component.resultado?.exito).toBeTrue();
    });

    it('un objetivo que no se pulsa a tiempo se pierde y con él la partida si ya no alcanzan', () => {
      component.empezar();
      ahora = 1000;
      component.tick(ahora);

      expect(component.resultado).toEqual({ exito: false, puntaje: 0 });
    });

    it('el aro se encoge con el tiempo', () => {
      component.empezar();
      component.tick(0);
      const inicio = component.fraccionObjetivo;
      component.tick(500);

      expect(inicio).toBe(1);
      expect(component.fraccionObjetivo).toBe(0.5);
    });
  });

  describe('precision', () => {
    // aleatorio() = 0.5 → zona en 40–60 con anchoZona 20
    const config: IMinijuegoConfig = { tipo: 'precision', velocidad: 5, anchoZona: 20, intentos: 2 };
    beforeEach(() => montar(config, 0.5));

    it('parar dentro de la zona gana', () => {
      component.empezar();
      ahora = 500;                                   // marcador ≈ 47,5 %
      component.tick(ahora);

      tecla(' ');

      expect(component.resultado).toEqual({ exito: true, puntaje: 1 });
    });

    it('parar fuera gasta un intento y lo anuncia', () => {
      component.empezar();

      tecla('Enter');                                // marcador en 0: fuera
      detectar();

      expect(component.estadoPrecision?.intento).toBe(2);
      expect(component.anuncio).toContain('Intento 2 de 2');
      expect(component.fase).toBe('jugando');
    });

    it('agotar los intentos es fallo', () => {
      component.empezar();

      tecla(' '); tecla(' ');

      expect(component.resultado).toEqual({ exito: false, puntaje: 0 });
    });
  });
});
