import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { IToken, IUsuarioPost } from '@models/usuario.interfaces';
import { UsuariosService } from '@services/usuarios.service';
import { SignupPageComponent } from './signup-page.component';

describe('SignupPageComponent (registrarse jugando una novela)', () => {
  let fixture: ComponentFixture<SignupPageComponent>;
  let componente: SignupPageComponent;
  let enviados: IUsuarioPost[];
  let respuesta: () => Observable<IToken>;
  let navegar: jasmine.Spy;

  const el = () => fixture.nativeElement as HTMLElement;
  const texto = () => (el().textContent ?? '').replace(/\s+/g, ' ');
  const boton = (nombre: string) => Array.from(el().querySelectorAll('button')).find(b => b.textContent?.trim().startsWith(nombre)) as HTMLButtonElement | undefined;
  const campo = () => el().querySelector<HTMLInputElement>('#stage-entrada');
  const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };
  const pulsar = (nombre: string) => { const b = boton(nombre); expect(b).withContext(`botón «${nombre}»`).toBeTruthy(); b!.click(); refrescar(); };
  const escribir = (valor: string) => { campo()!.value = valor; pulsar('Aceptar'); };
  const siguiente = () => pulsar('Siguiente');

  /** Hasta la pregunta del nombre, y luego cada dato con sus frases de Dr. Cerebro entre medio. */
  const hastaNombre = () => { siguiente(); siguiente(); };
  const rellenar = (datos = { nombre: 'Juan Pérez', usuario: 'juanperez', email: 'juan@ejemplo.com', password: 'Secreta#1' }) => {
    hastaNombre(); escribir(datos.nombre);
    siguiente(); escribir(datos.usuario);
    siguiente(); escribir(datos.email);
    siguiente(); escribir(datos.password);
  };

  beforeEach(async () => {
    enviados = [];
    respuesta = () => of({} as IToken);
    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        { provide: UsuariosService, useValue: { postUsuario: (u: IUsuarioPost) => { enviados.push(u); return respuesta(); } } },
        provideRouter([]),
      ],
    }).compileComponents();
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(SignupPageComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('empieza como una novela: Dr. Cerebro saluda, con su sprite y un fondo, y hay un botón para seguir', () => {
    expect(texto()).toContain('Soy el Dr. Cerebro');
    expect(texto()).toContain('Dr. Cerebro');
    expect(el().querySelectorAll('img').length).toBe(1);
    expect(el().querySelector('img')!.getAttribute('src')).toContain('Chihiro');
    expect(boton('Siguiente')).toBeTruthy();
    expect(enviados.length).toBe(0);   // registrar solo ocurre al final
  });

  it('el registro no se dispara antes de terminar la historia', () => {
    rellenar();

    expect(texto()).toContain('¿Creo tu cuenta?');
    expect(enviados.length).toBe(0);
  });

  it('cada dato se pide en un campo con el foco puesto', () => {
    hastaNombre();

    expect(campo()).toBeTruthy();
    expect(document.activeElement).toBe(campo());
    expect(campo()!.type).toBe('text');
  });

  it('el correo usa el campo de correo y la contraseña un campo enmascarado', () => {
    hastaNombre(); escribir('Juan');
    siguiente(); escribir('juanperez');
    siguiente();
    expect(campo()!.type).toBe('email');
    expect(campo()!.getAttribute('autocomplete')).toBe('email');
    escribir('juan@ejemplo.com');
    siguiente();
    expect(campo()!.type).toBe('password');
    expect(campo()!.getAttribute('autocomplete')).toBe('new-password');
  });

  describe('cuando lo escrito no vale', () => {
    it('Dr. Cerebro lo explica, y al seguir se vuelve a la misma pregunta con lo escrito para corregirlo', () => {
      hastaNombre(); escribir('Juan'); siguiente(); escribir('juanperez'); siguiente();

      escribir('juan@ejemplo');   // sin dominio
      expect(texto()).toContain('Ese correo no parece válido');
      expect(campo()).toBeNull();
      expect(boton('Siguiente')).toBeTruthy();

      siguiente();
      expect(campo()!.type).toBe('email');
      expect(campo()!.value).toBe('juan@ejemplo');   // no hay que volver a escribirlo todo
    });

    it('el aviso de la contraseña dice qué le falta, y la contraseña no se muestra de nuevo', () => {
      hastaNombre(); escribir('Juan'); siguiente(); escribir('juanperez'); siguiente(); escribir('juan@ejemplo.com'); siguiente();

      escribir('abc');
      expect(texto()).toContain('Tu contraseña necesita: al menos 6 caracteres, una mayúscula, un número, un símbolo');

      siguiente();
      expect(campo()!.type).toBe('password');
      expect(campo()!.value).toBe('');
    });

    it('un nombre vacío no avanza', () => {
      hastaNombre();

      escribir('   ');

      expect(texto()).toContain('Necesito un nombre');
      siguiente();
      expect(campo()!.getAttribute('placeholder')).toBe('Ej: Juan Pérez');
      expect(enviados.length).toBe(0);
    });

    it('lo válido se acepta a la primera y no genera avisos', () => {
      hastaNombre(); escribir('Juan Pérez');

      expect(texto()).toContain('Mucho gusto, Juan Pérez.');
    });
  });

  describe('confirmar y registrar', () => {
    it('resume lo que escribió, sin la contraseña', () => {
      rellenar();

      expect(texto()).toContain('Juan Pérez, usuario «juanperez», correo juan@ejemplo.com');
      expect(texto()).not.toContain('Secreta#1');
    });

    it('al confirmar envía los datos al servidor UNA vez, y mientras responde no hay botón para avanzar', () => {
      const pendiente = new Subject<IToken>();
      respuesta = () => pendiente;
      rellenar();

      pulsar('Sí, crear mi cuenta');

      expect(enviados).toEqual([{ nombre: 'Juan Pérez', userName: 'juanperez', email: 'juan@ejemplo.com', password: 'Secreta#1' }]);
      expect(texto()).toContain('Dame un momento');
      expect(boton('Siguiente')).toBeUndefined();
      expect(componente.registrando).toBeTrue();
      refrescar();
      expect(enviados.length).toBe(1);
    });

    it('si sale bien: da la bienvenida por su nombre, borra la contraseña de la memoria y el botón lleva a iniciar sesión', () => {
      rellenar();
      pulsar('Sí, crear mi cuenta');

      expect(texto()).toContain('¡Listo, Juan Pérez! Tu cuenta ha sido creada.');
      expect(componente.estado.vars['password']).toBe('');
      expect(el().querySelector('img')!.getAttribute('src')).toContain('redd.it');   // el arte del final

      pulsar('Iniciar sesión');
      expect(navegar).toHaveBeenCalledWith(['/auth/login']);
    });

    it('si el servidor falla: lo cuenta y permite reintentar con los mismos datos', () => {
      respuesta = () => throwError(() => new Error('400'));
      rellenar();
      pulsar('Sí, crear mi cuenta');

      expect(texto()).toContain('No pude crear tu cuenta');
      expect(componente.registrando).toBeFalse();
      expect(navegar).not.toHaveBeenCalled();

      respuesta = () => of({} as IToken);
      pulsar('Intentarlo de nuevo');

      expect(enviados.length).toBe(2);
      expect(enviados[1]).toEqual(enviados[0]);
      expect(texto()).toContain('¡Listo, Juan Pérez!');
    });

    it('si el usuario ya existe puede elegir otro y confirmar de nuevo sin repetir todo', () => {
      respuesta = () => throwError(() => new Error('400'));
      rellenar();
      pulsar('Sí, crear mi cuenta');

      pulsar('Elegir otro nombre de usuario');
      expect(campo()!.value).toBe('juanperez');   // el anterior a la vista para cambiarlo
      escribir('juan_perez_2');

      expect(texto()).toContain('¿Creo tu cuenta?');
      expect(texto()).toContain('usuario «juan_perez_2»');
      respuesta = () => of({} as IToken);
      pulsar('Sí, crear mi cuenta');

      expect(enviados.length).toBe(2);
      expect(enviados[1]).toEqual({ nombre: 'Juan Pérez', userName: 'juan_perez_2', email: 'juan@ejemplo.com', password: 'Secreta#1' });
      expect(texto()).toContain('¡Listo, Juan Pérez!');
    });
  });

  describe('corregir antes de crear la cuenta', () => {
    it('elegir «Mi correo» pide solo el correo, prellenado, y vuelve a la confirmación', () => {
      rellenar();

      pulsar('Quiero corregir algo');
      expect(texto()).toContain('¿Qué quieres corregir?');
      pulsar('Mi correo');
      expect(campo()!.value).toBe('juan@ejemplo.com');
      escribir('otro@ejemplo.com');

      expect(texto()).toContain('¿Creo tu cuenta?');
      expect(texto()).toContain('correo otro@ejemplo.com');
      pulsar('Sí, crear mi cuenta');
      expect(enviados[0]).toEqual({ nombre: 'Juan Pérez', userName: 'juanperez', email: 'otro@ejemplo.com', password: 'Secreta#1' });
    });

    it('corregir con un valor inválido también avisa y vuelve a esa pregunta (no a la confirmación)', () => {
      rellenar();
      pulsar('Quiero corregir algo'); pulsar('Mi nombre de usuario');

      escribir('a b');
      expect(texto()).toContain('sin espacios');
      siguiente();

      expect(campo()!.value).toBe('a b');
      escribir('valido_1');
      expect(texto()).toContain('¿Creo tu cuenta?');
    });

    it('«Nada, todo está bien» vuelve a la confirmación', () => {
      rellenar();
      pulsar('Quiero corregir algo'); pulsar('Nada, todo está bien');

      expect(texto()).toContain('¿Creo tu cuenta?');
      expect(enviados.length).toBe(0);
    });
  });

  it('ofrece iniciar sesión para quien ya tiene cuenta', () => {
    expect(texto()).toContain('¿Ya tienes una cuenta?');
    expect(el().querySelector('a')?.textContent).toContain('Inicia sesión');
  });

  it('usa el formato libre del escenario: en móvil el escenario es alto y caben las opciones', () => {
    expect(el().querySelector('.aspect-\\[4\\/5\\]')).toBeTruthy();
  });
});
