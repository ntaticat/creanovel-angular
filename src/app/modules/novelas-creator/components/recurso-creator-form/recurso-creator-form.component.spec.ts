import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { RecursosEnum } from '@models/recurso.interfaces';
import { RecursoCreatorFormComponent } from './recurso-creator-form.component';

describe('RecursoCreatorFormComponent (tipo de recurso)', () => {
  let fixture: ComponentFixture<RecursoCreatorFormComponent>;
  let component: RecursoCreatorFormComponent;
  const control = (nombre: string): AbstractControl => component.recursoForm.get(nombre)!;
  const elegirTipo = (tipo: RecursosEnum) => control('tipoRecurso').setValue(tipo);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursoCreatorFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(RecursoCreatorFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('escenaId', 'e1');
    fixture.detectChanges();
  });

  it('Habla exige mensaje', () => {
    expect(control('mensaje').valid).toBeFalse();
    control('mensaje').setValue('Hola');

    expect(component.recursoForm.valid).toBeTrue();
  });

  it('al cambiar a Asigna el mensaje deja de ser obligatorio (los validadores usan el tipo nuevo, no el anterior)', () => {
    elegirTipo(RecursosEnum.asigna);

    expect(control('mensaje').valid).toBeTrue();
    expect(component.recursoForm.valid).toBeTrue();
  });

  it('al cambiar a Evalúa tampoco exige mensaje', () => {
    elegirTipo(RecursosEnum.evalua);

    expect(control('mensaje').valid).toBeTrue();
  });

  it('volver a Habla vuelve a exigir el mensaje', () => {
    elegirTipo(RecursosEnum.asigna);
    elegirTipo(RecursosEnum.conversacion);

    expect(control('mensaje').valid).toBeFalse();
  });

  it('Pide exige la variable donde guarda lo escrito', () => {
    elegirTipo(RecursosEnum.entrada);
    control('mensaje').setValue('¿Cómo te llamas?');

    expect(control('clave').valid).toBeFalse();
    control('clave').setValue('nombre');
    expect(component.recursoForm.valid).toBeTrue();
  });

  it('al cambiar a Juega se preparan sus dos salidas, éxito y fallo, en ese orden', () => {
    elegirTipo(RecursosEnum.juega);

    expect(component.opciones.length).toBe(2);
    expect(component.opciones.controls.map(g => g.get('tipo')!.value)).toEqual(['exito', 'fallo']);
    expect(component.esJuega).toBeTrue();
  });

  it('Juega no exige mensaje y es válido con la configuración por defecto', () => {
    elegirTipo(RecursosEnum.juega);

    expect(component.recursoForm.valid).toBeTrue();
  });

  it('un ajuste del minijuego elegido fuera de rango invalida el formulario; uno de otro minijuego oculto no', () => {
    elegirTipo(RecursosEnum.juega);
    const ajustes = control('minijuego');

    ajustes.get('velocidad')!.setValue(99);           // ajuste de "precisión": oculto mientras el tipo es reflejo
    expect(component.recursoForm.valid).toBeTrue();

    ajustes.get('objetivos')!.setValue(0);             // ajuste de "reflejo": visible
    expect(component.recursoForm.valid).toBeFalse();

    ajustes.get('objetivos')!.setValue(5);
    control('minijuegoTipo').setValue('precision');   // ahora el fuera de rango es el visible
    expect(component.recursoForm.valid).toBeFalse();
  });

  it('la configuración de prueba sigue a los ajustes y al tipo', () => {
    elegirTipo(RecursosEnum.juega);
    control('minijuego').get('objetivos')!.setValue(8);
    expect(component.configMinijuego).toEqual(jasmine.objectContaining({ tipo: 'reflejo', objetivos: 8 }));

    control('minijuegoTipo').setValue('pulsaciones');
    control('minijuego').get('objetivo')!.setValue(40);
    expect(component.configMinijuego).toEqual(jasmine.objectContaining({ tipo: 'pulsaciones', objetivo: 40 }));
  });

  it('salir de Juega descarta sus salidas', () => {
    elegirTipo(RecursosEnum.juega);
    elegirTipo(RecursosEnum.evalua);

    expect(component.opciones.length).toBe(0);
  });

  it('cambiar entre Selecciona y Evalúa conserva las opciones escritas', () => {
    elegirTipo(RecursosEnum.decision);
    component.agregarOpcion();
    elegirTipo(RecursosEnum.evalua);

    expect(component.opciones.length).toBe(1);
  });

  it('en Evalúa una rama sin condición invalida el formulario', () => {
    elegirTipo(RecursosEnum.evalua);
    component.agregarOpcion();

    expect(component.recursoForm.valid).toBeFalse();
    component.opciones.at(0).patchValue({ condicion: { var: 'salud', op: '>', valor: 1 } });
    expect(component.recursoForm.valid).toBeTrue();
  });

  it('un Explora exige nombre y región en cada zona', () => {
    elegirTipo(RecursosEnum.explora);
    component.agregarZona({ x: 10, y: 10, ancho: 20, alto: 20 });

    expect(component.recursoForm.valid).toBeTrue();
    component.opciones.at(0).patchValue({ opcionMensaje: '' });
    expect(component.recursoForm.valid).toBeFalse();
  });

  it('los destinos de una salida pueden ser el propio nodo (reintentar), los del "siguiente" simple no', () => {
    const recurso = { recursoId: 'r1', tipoRecurso: RecursosEnum.juega, mensaje: '', minijuego: { tipo: 'pulsaciones', objetivo: 3, tiempoMs: 2000 }, opciones: [] } as never;
    fixture.componentRef.setInput('escenas', [{ escenaId: 'e1', identificador: 'Pasillo', recursos: [recurso, { recursoId: 'r2', tipoRecurso: RecursosEnum.conversacion, mensaje: 'x' }] }]);
    fixture.componentRef.setInput('recursoEditar', recurso);
    fixture.detectChanges();

    expect(component.recursosDisponibles.map(o => o.recurso.recursoId)).toEqual(['r1', 'r2']);
    expect(component.recursosParaSiguiente.map(o => o.recurso.recursoId)).toEqual(['r2']);
  });

  it('editar un Juega carga su minijuego y exactamente dos salidas', () => {
    const recurso = {
      recursoId: 'r1', escenaId: 'e1', tipoRecurso: RecursosEnum.juega, primerRecurso: false, ultimoRecurso: false,
      mensaje: 'Rápido', variableResultado: 'puntos',
      minijuego: { tipo: 'secuencia', longitud: 6, tiempoMs: 9000 },
      opciones: [
        { recursoDecisionOpcionId: 'o2', tipo: 'fallo', siguienteRecursoId: 'r1', opcionMensaje: '', orden: 1, condicionModo: 'ocultar', recursoDecisionId: 'r1' },
        { recursoDecisionOpcionId: 'o1', tipo: 'exito', siguienteRecursoId: 'r9', opcionMensaje: '', orden: 0, condicionModo: 'ocultar', recursoDecisionId: 'r1' },
      ],
    } as never;
    fixture.componentRef.setInput('recursoEditar', recurso);
    fixture.detectChanges();

    expect(component.esJuega).toBeTrue();
    expect(control('minijuegoTipo').value).toBe('secuencia');
    expect(control('minijuego').get('longitud')!.value).toBe(6);
    expect(control('variableResultado').value).toBe('puntos');
    expect(component.opciones.length).toBe(2);
    expect(component.opciones.controls.map(g => g.get('tipo')!.value)).toEqual(['exito', 'fallo']);   // en orden, aunque lleguen al revés
    expect(component.opciones.at(1).get('siguienteRecursoId')!.value).toBe('r1');
  });

  it('editar un Juega al que le falta una salida la recrea vacía', () => {
    const recurso = {
      recursoId: 'r1', escenaId: 'e1', tipoRecurso: RecursosEnum.juega, primerRecurso: false, ultimoRecurso: false, mensaje: '',
      minijuego: { tipo: 'reflejo', objetivos: 3, aciertosNecesarios: 2, duracionMs: 1000 },
      opciones: [{ recursoDecisionOpcionId: 'o1', tipo: 'exito', opcionMensaje: '', orden: 0, condicionModo: 'ocultar', recursoDecisionId: 'r1' }],
    } as never;
    fixture.componentRef.setInput('recursoEditar', recurso);
    fixture.detectChanges();

    expect(component.opciones.controls.map(g => g.get('tipo')!.value)).toEqual(['exito', 'fallo']);
    expect(component.opciones.at(1).get('id')!.value).toBeNull();
  });

  describe('Termina', () => {
    it('exige elegir un final; no exige mensaje', () => {
      elegirTipo(RecursosEnum.termina);

      expect(control('mensaje').valid).toBeTrue();
      expect(control('final').valid).toBeFalse();
      expect(component.recursoForm.valid).toBeFalse();

      control('final').setValue('bueno');
      expect(component.recursoForm.valid).toBeTrue();
    });

    it('volver a otro tipo ya no exige el final', () => {
      elegirTipo(RecursosEnum.termina);
      elegirTipo(RecursosEnum.asigna);

      expect(control('final').valid).toBeTrue();
    });

    it('lista los finales del catálogo', () => {
      fixture.componentRef.setInput('definiciones', {
        variables: [], finales: [{ id: 'bueno', nombre: 'Bueno', descripcion: '' }],
      });
      fixture.detectChanges();

      expect(component.finalesDefinidos.map(f => f.id)).toEqual(['bueno']);
    });

    it('editar un Termina carga su final y su texto, y no prepara salidas', () => {
      const recurso = {
        recursoId: 'r1', escenaId: 'e1', tipoRecurso: RecursosEnum.termina, primerRecurso: false, ultimoRecurso: true,
        final: 'malo', mensaje: 'Fin, {nombre}',
      } as never;
      fixture.componentRef.setInput('recursoEditar', recurso);
      fixture.detectChanges();

      expect(component.esTermina).toBeTrue();
      expect(control('final').value).toBe('malo');
      expect(control('mensaje').value).toBe('Fin, {nombre}');
      expect(component.opciones.length).toBe(0);
    });
  });
  describe('personajes en el escenario (plegable)', () => {
    const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };
    afterEach(() => refrescar());
    const cuerpo = () => fixture.nativeElement.querySelector('app-tarjeta-plegable [id^="tarjeta-plegable-"]') as HTMLElement;

    it('el escenario de personajes empieza plegado y dice que no hay ninguno', () => {
      expect(component.personajesAbiertos).toBeFalse();
      expect(cuerpo().hidden).toBeTrue();
      expect(component.resumenPersonajes).toBe('Ninguno: ábrelo para añadir');
    });

    it('el resumen cuenta cuántos hay y quiénes son', () => {
      fixture.componentRef.setInput('personajes', [
        { personajeId: 'p1', nombre: 'Ana', sprites: [{ personajeSpriteId: 's1', nombre: 'a', direccionImagen: '/u/a.png' }, { personajeSpriteId: 's2', nombre: 'b', direccionImagen: '/u/b.png' }] },
        { personajeId: 'p2', nombre: 'Beto', sprites: [{ personajeSpriteId: 's3', nombre: 'c', direccionImagen: '/u/c.png' }] },
      ]);
      component.cambiarPersonajes([
        { personajeSpriteId: 's1', x: 25, y: 50, escala: 1, espejo: false },
        { personajeSpriteId: 's2', x: 50, y: 50, escala: 1, espejo: false },
        { personajeSpriteId: 's3', x: 75, y: 50, escala: 1, espejo: false },
      ]);

      expect(component.resumenPersonajes).toBe('3 en escena · Ana, Beto');
    });

    it('al editar otro nodo vuelve a empezar plegado', () => {
      component.personajesAbiertos = true;
      fixture.componentRef.setInput('recursoEditar', {
        recursoId: 'r1', escenaId: 'e1', tipoRecurso: RecursosEnum.conversacion, primerRecurso: false, ultimoRecurso: false, mensaje: 'Hola',
      } as never);
      refrescar();

      expect(component.personajesAbiertos).toBeFalse();
    });
  });

  describe('opciones plegables (solo se edita una a la vez)', () => {
    const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };
    const cuerpos = () => Array.from(fixture.nativeElement.querySelectorAll('[formarrayname="opciones"] app-tarjeta-plegable [id^="tarjeta-plegable-"]')) as HTMLElement[];
    const abiertas = () => cuerpos().map(c => !c.hidden);

    // Sin zona, lo que un test cambia a mano no marca la vista como sucia: una pasada de comprobación posterior lo vería como un
    // «cambio tras comprobar». En el navegador esos cambios ocurren en manejadores de eventos, que sí la marcan.
    afterEach(() => refrescar());

    /**
     * Un Selecciona ya guardado con `n` opciones. Se carga como recurso a editar en vez de cambiar el tipo de uno nuevo: ese cambio,
     * seguido de una detección de cambios síncrona, hace saltar una comprobación en el entorno de pruebas sin zona (en el navegador,
     * cambiar el tipo no da ningún error).
     */
    const editarSelecciona = (n: number, mensajes: string[] = []) => {
      fixture.componentRef.setInput('recursoEditar', {
        recursoId: 'd1', escenaId: 'e1', tipoRecurso: RecursosEnum.decision, primerRecurso: false, ultimoRecurso: false,
        decisionMensaje: '¿Qué haces?',
        opciones: Array.from({ length: n }, (_, i) => ({
          recursoDecisionOpcionId: `o${i}`, tipo: 'opcion', opcionMensaje: mensajes[i] ?? `Opción ${i}`, orden: i, condicionModo: 'ocultar', recursoDecisionId: 'd1',
        })),
      } as never);
      refrescar();
    };

    it('las opciones de un nodo que se edita se ven plegadas, con su título y resumen', () => {
      editarSelecciona(3, ['Sí', 'No', 'Quizá']);

      expect(component.opcionAbierta).toBe(-1);
      expect(abiertas()).toEqual([false, false, false]);
      expect(fixture.nativeElement.textContent).toContain('Opción 2 · No');
    });

    it('una opción nueva se abre para rellenarla y al añadir otra la anterior se pliega', () => {
      editarSelecciona(0);
      component.agregarOpcion();
      refrescar();
      expect(abiertas()).toEqual([true]);

      component.agregarOpcion();
      component.agregarOpcion();
      refrescar();

      expect(abiertas()).toEqual([false, false, true]);
      expect(component.opcionAbierta).toBe(2);
    });

    it('pulsar la línea de una opción la abre y cierra la otra; volver a pulsarla la pliega', () => {
      editarSelecciona(2);
      const linea = (i: number) => fixture.nativeElement.querySelectorAll('[formarrayname="opciones"] app-tarjeta-plegable button[aria-expanded]')[i] as HTMLButtonElement;

      linea(0).click(); refrescar();
      expect(abiertas()).toEqual([true, false]);
      linea(1).click(); refrescar();
      expect(abiertas()).toEqual([false, true]);
      linea(1).click(); refrescar();
      expect(abiertas()).toEqual([false, false]);
    });

    it('abrir una la abre y cierra la otra; cerrar una que no estaba abierta no toca la abierta', () => {
      editarSelecciona(2);

      component.fijarOpcion(0, true);
      expect(component.opcionAbierta).toBe(0);

      component.fijarOpcion(1, false);
      expect(component.opcionAbierta).toBe(0);

      component.fijarOpcion(0, false);
      expect(component.opcionAbierta).toBe(-1);
    });

    it('mover una opción no cierra la que se está editando ni cambia otra', () => {
      editarSelecciona(3);
      component.fijarOpcion(1, true);
      const abierta = component.opciones.at(1);

      component.moverOpcion(1, 1);   // baja
      expect(component.opciones.at(component.opcionAbierta)).toBe(abierta);

      component.moverOpcion(component.opcionAbierta, -1);   // sube de nuevo
      expect(component.opciones.at(component.opcionAbierta)).toBe(abierta);

      component.fijarOpcion(0, true);   // otra abierta: mover una vecina la desplaza sin perderla
      const otra = component.opciones.at(0);
      component.moverOpcion(1, -1);     // la de la posición 1 sube y ocupa el 0: la abierta pasa al 1
      expect(component.opciones.at(component.opcionAbierta)).toBe(otra);
    });

    it('quitar una opción anterior a la abierta la mantiene abierta; quitar la abierta pliega todo', () => {
      editarSelecciona(3);
      component.fijarOpcion(2, true);
      const abierta = component.opciones.at(2);

      component.quitarOpcion(0);
      expect(component.opciones.at(component.opcionAbierta)).toBe(abierta);

      component.quitarOpcion(component.opcionAbierta);
      expect(component.opcionAbierta).toBe(-1);
    });

    it('al guardar con una opción incompleta plegada se abre la primera incompleta', () => {
      elegirTipo(RecursosEnum.evalua);
      component.agregarOpcion(); component.agregarOpcion();
      component.opciones.at(0).patchValue({ condicion: { var: 'salud', op: '>', valor: 1 } });   // la 2.ª sigue sin condición
      component.fijarOpcion(0, true);

      component.onSubmit();

      expect(component.opcionAbierta).toBe(1);
    });

    it('una rama sin condición avisa de lo que falta aunque esté plegada', () => {
      elegirTipo(RecursosEnum.evalua);
      component.agregarOpcion();

      expect(component.advertenciaOpcion(component.opciones.at(0))).toBe('Falta la condición');

      component.opciones.at(0).patchValue({ condicion: { var: 'salud', op: '>', valor: 1 } });
      expect(component.advertenciaOpcion(component.opciones.at(0))).toBe('');
    });

    it('una opción de Selecciona sin mensaje avisa de que falta', () => {
      editarSelecciona(1);
      component.opciones.at(0).patchValue({ opcionMensaje: '' });

      expect(component.advertenciaOpcion(component.opciones.at(0))).toBe('Falta el mensaje');
    });

    it('un Explora avisa de que falta el nombre o la región', () => {
      elegirTipo(RecursosEnum.explora);
      component.agregarZona({ x: 10, y: 10, ancho: 20, alto: 20 });
      component.opciones.at(0).patchValue({ opcionMensaje: '' });

      expect(component.advertenciaOpcion(component.opciones.at(0))).toBe('Falta el nombre');
    });

    it('el título dice qué es y cuál es; con mensaje lo incluye, acortado', () => {
      editarSelecciona(2, ['', 'Retar al dragón']);
      expect(component.tituloOpcion(component.opciones.at(0), 0)).toBe('Opción 1');
      expect(component.tituloOpcion(component.opciones.at(1), 1)).toBe('Opción 2 · Retar al dragón');

      component.opciones.at(1).patchValue({ opcionMensaje: 'x'.repeat(80) });
      expect(component.tituloOpcion(component.opciones.at(1), 1).endsWith('…')).toBeTrue();
    });

    it('una rama se titula «Rama n»', () => {
      elegirTipo(RecursosEnum.evalua);
      component.agregarOpcion();

      expect(component.tituloOpcion(component.opciones.at(0), 0)).toBe('Rama 1');
    });

    it('el resumen junta condición, efectos y destino', () => {
      const escenas = [{ escenaId: 'e1', identificador: 'Pasillo', recursos: [{ recursoId: 'r2', tipoRecurso: RecursosEnum.conversacion, mensaje: 'Hola viajero' }] }];
      fixture.componentRef.setInput('escenas', escenas);
      editarSelecciona(1);
      const grupo = component.opciones.at(0);

      expect(component.resumenOpcion(grupo)).toBe('fin de rama');

      grupo.patchValue({
        condicion: { var: 'salud', op: '>=', valor: 30 },
        efectos: [{ var: 'salud', op: 'restar', valor: 10 }],
        siguienteRecursoId: 'r2',
      });
      expect(component.resumenOpcion(grupo)).toBe('si salud >= 30 · salud -= 10 · → Pasillo — Habla: Hola viajero');
    });

    it('un Explora resume dónde está la zona, y una zona sin destino que aplica efectos lo dice', () => {
      elegirTipo(RecursosEnum.explora);
      component.agregarZona({ x: 10, y: 20, ancho: 30, alto: 40 });
      const grupo = component.opciones.at(0);
      expect(component.resumenOpcion(grupo)).toBe('10% · 20% · 30×40 · fin de rama');

      grupo.patchValue({ efectos: [{ objeto: 'llave', op: 'dar' }] });
      expect(component.resumenOpcion(grupo)).toContain('solo aplica los efectos');
    });

    it('en una Evalúa la condición es lo principal: «se toma si»', () => {
      elegirTipo(RecursosEnum.evalua);
      component.agregarOpcion();
      component.opciones.at(0).patchValue({ condicion: { var: 'tiempo', op: '==', valor: 'tarde' } });

      expect(component.resumenOpcion(component.opciones.at(0))).toContain('se toma si tiempo == "tarde"');
    });

    it('tocar una zona en el escenario abre su detalle (y las demás se pliegan)', () => {
      elegirTipo(RecursosEnum.explora);
      component.agregarZona({ x: 10, y: 10, ancho: 20, alto: 20 });
      component.agregarZona({ x: 50, y: 50, ancho: 20, alto: 20 });
      expect(component.opcionAbierta).toBe(1);   // la recién dibujada

      component.seleccionarZona(0);
      refrescar();

      expect(abiertas()).toEqual([true, false]);
    });

    it('un minijuego nuevo abre su primera salida; uno que se edita las muestra plegadas', () => {
      elegirTipo(RecursosEnum.juega);
      expect(component.opcionAbierta).toBe(0);

      const recurso = {
        recursoId: 'r1', escenaId: 'e1', tipoRecurso: RecursosEnum.juega, primerRecurso: false, ultimoRecurso: false, mensaje: '',
        minijuego: { tipo: 'reflejo', objetivos: 3, aciertosNecesarios: 2, duracionMs: 1000 },
        opciones: [
          { recursoDecisionOpcionId: 'o1', tipo: 'exito', opcionMensaje: '', orden: 0, condicionModo: 'ocultar', recursoDecisionId: 'r1' },
          { recursoDecisionOpcionId: 'o2', tipo: 'fallo', opcionMensaje: '', orden: 1, condicionModo: 'ocultar', recursoDecisionId: 'r1' },
        ],
      } as never;
      fixture.componentRef.setInput('recursoEditar', recurso);
      refrescar();

      expect(component.opcionAbierta).toBe(-1);
      expect(abiertas()).toEqual([false, false]);
      expect(component.resumenOpcion(component.opciones.at(0))).toBe('la historia termina');
    });

    it('cambiar de nodo o de tipo no deja abierta una opción que ya no existe', () => {
      elegirTipo(RecursosEnum.juega);
      elegirTipo(RecursosEnum.conversacion);

      expect(component.opcionAbierta).toBe(-1);
    });
  });
});
