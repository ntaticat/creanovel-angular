import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IDefiniciones } from '@models/motor.interfaces';
import { IEscena } from '@models/escena.interfaces';
import { DefinicionesEditorComponent } from './definiciones-editor.component';

describe('DefinicionesEditorComponent — uso de objetos', () => {
  let fixture: ComponentFixture<DefinicionesEditorComponent>;
  let editor: DefinicionesEditorComponent;
  const el = () => fixture.nativeElement as HTMLElement;

  const definiciones: IDefiniciones = {
    variables: [{ clave: 'salud', etiqueta: 'Salud', tipo: 'numero', inicial: 50, valores: [], hud: 'oculto' }],
    objetos: [{ id: 'pocion', nombre: 'Poción', descripcion: '', apilable: true, max: null, inicial: 0 }],
  };
  const escenas = [
    {
      escenaId: 'e1',
      identificador: 'Cueva',
      recursos: [{ recursoId: 'r1', tipoRecurso: 'recurso_conversacion', mensaje: 'Hola viajero' }],
    },
  ] as unknown as IEscena[];

  async function montar() {
    await TestBed.configureTestingModule({
      imports: [DefinicionesEditorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DefinicionesEditorComponent);
    editor = fixture.componentInstance;
    fixture.componentRef.setInput('novelaVersionId', 'v1');
    fixture.componentRef.setInput('definiciones', definiciones);
    fixture.componentRef.setInput('escenas', escenas);
    fixture.detectChanges();
    editor.cambiarPestana('objetos');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  const usoActual = () => editor.objetos[0].uso;

  it('un objeto sin uso solo muestra la casilla para activarlo', async () => {
    await montar();

    expect(el().textContent).toContain('Se puede usar desde la mochila');
    expect(el().textContent).not.toContain('Efectos al usarlo');
  });

  it('activar el uso muestra sus campos y desactivarlo lo quita', async () => {
    await montar();

    editor.alternarUso(0, true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(usoActual()).toEqual({ etiqueta: '', condicion: null, efectos: null, consumir: false, destinoRecursoId: null });
    expect(el().textContent).toContain('Efectos al usarlo');
    expect(el().textContent).toContain('Se gasta una unidad al usarlo');

    editor.alternarUso(0, false);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(usoActual()).toBeNull();
    expect(el().textContent).not.toContain('Efectos al usarlo');
  });

  it('los cambios del uso se guardan en la fila sin perder lo demás', async () => {
    await montar();
    editor.alternarUso(0, true);

    editor.cambiarUso(0, { etiqueta: 'Beber', consumir: true });
    editor.cambiarEfectosUso(0, [{ var: 'salud', op: 'sumar', valor: 20 }]);
    editor.cambiarCondicionUso(0, { en: 'cueva' });
    editor.cambiarDestinoUso(0, 'r1');

    expect(usoActual()).toEqual({
      etiqueta: 'Beber',
      consumir: true,
      efectos: [{ var: 'salud', op: 'sumar', valor: 20 }],
      condicion: { en: 'cueva' },
      destinoRecursoId: 'r1',
    });

    editor.cambiarDestinoUso(0, '');
    expect(usoActual()?.destinoRecursoId).toBeNull();
  });

  it('cambiar el uso de un objeto sin uso no hace nada', async () => {
    await montar();

    editor.cambiarUso(0, { consumir: true });

    expect(usoActual()).toBeUndefined();
  });

  it('ofrece como destino los nodos de la versión, con su escena y tipo', async () => {
    await montar();

    expect(editor.destinosUso).toEqual([{ id: 'r1', etiqueta: 'Cueva — Habla: Hola viajero' }]);
  });

  it('el contexto de los efectos incluye lo recién creado sin guardar, y es estable entre ciclos', async () => {
    await montar();
    const antes = editor.definicionesEnEdicion;
    expect(editor.definicionesEnEdicion).toBe(antes);   // misma referencia mientras nada cambie (evita NG0100)

    editor.agregar();
    editor.cambiar(1, { clave: 'oro' });

    expect(editor.definicionesEnEdicion).not.toBe(antes);
    expect(editor.definicionesEnEdicion.variables.map(v => v.clave)).toEqual(['salud', 'oro']);
  });

  it('las filas nuevas sin identificar todavía no se ofrecen para citarlas', async () => {
    await montar();

    editor.agregar();
    editor.agregarObjeto();

    expect(editor.definicionesEnEdicion.variables.length).toBe(1);
    expect(editor.definicionesEnEdicion.objetos?.length).toBe(1);
  });

  it('guardar envía el uso dentro del objeto', async () => {
    await montar();
    editor.alternarUso(0, true);
    editor.cambiarUso(0, { etiqueta: 'Beber', consumir: true });
    const enviados: IDefiniciones[] = [];
    spyOn(editor['novelasVersionesService'], 'putDefiniciones').and.callFake((_id, defs) => {
      enviados.push(defs);
      return { subscribe: () => undefined } as never;
    });

    editor.guardar();

    expect(enviados[0].objetos?.[0].uso).toEqual({ etiqueta: 'Beber', condicion: null, efectos: null, consumir: true, destinoRecursoId: null });
  });
  describe('tarjetas plegables', () => {
    const refrescar = () => { fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); };
    const cuerpos = () => Array.from(el().querySelectorAll('app-tarjeta-plegable [id^="tarjeta-plegable-"]')) as HTMLElement[];
    const abiertas = () => cuerpos().map(c => !c.hidden);
    const titulos = () => Array.from(el().querySelectorAll('app-tarjeta-plegable button[aria-expanded] .font-medium')).map(t => t.textContent?.trim());
    const cabecera = (i: number) => el().querySelectorAll<HTMLButtonElement>('app-tarjeta-plegable button[aria-expanded]')[i];

    // Lo que un test cambia a mano no marca la vista como sucia (ver el spec del formulario de nodo): se refresca al terminar.
    afterEach(() => refrescar());

    it('lo que ya estaba guardado se ve plegado, con su título y su resumen', async () => {
      await montar();
      editor.cambiarPestana('variables');
      refrescar();

      expect(titulos()).toEqual(['Salud']);
      expect(abiertas()).toEqual([false]);
      expect(el().textContent).toContain('salud · número · inicial 50');
    });

    it('pulsar la tarjeta la abre y muestra sus campos; volver a pulsarla la pliega', async () => {
      await montar();
      editor.cambiarPestana('variables');
      refrescar();

      cabecera(0).click(); refrescar();
      expect(abiertas()).toEqual([true]);
      expect(editor.acordeon.esta('variables', 0)).toBeTrue();

      cabecera(0).click(); refrescar();
      expect(abiertas()).toEqual([false]);
    });

    it('añadir una variable abre la nueva y pliega la anterior, sin tener que desplazarse', async () => {
      await montar();
      editor.cambiarPestana('variables');
      refrescar();
      cabecera(0).click(); refrescar();
      expect(abiertas()).toEqual([true]);

      editor.agregar();
      refrescar();

      expect(abiertas()).toEqual([false, true]);
      expect(titulos()).toEqual(['Salud', 'Variable nueva']);
    });

    it('solo hay una abierta: abrir otra cierra la anterior', async () => {
      await montar();
      editor.cambiarPestana('variables');
      editor.agregar(); editor.agregar();
      refrescar();
      expect(abiertas()).toEqual([false, false, true]);

      cabecera(0).click(); refrescar();

      expect(abiertas()).toEqual([true, false, false]);
    });

    it('una tarjeta incompleta avisa plegada de lo que le falta', async () => {
      await montar();
      editor.cambiarPestana('variables');
      editor.agregar(); editor.agregar();   // la primera nueva queda plegada al abrirse la segunda
      refrescar();

      const avisos = Array.from(el().querySelectorAll('app-tarjeta-plegable .badge-warning')).map(a => a.getAttribute('title'));
      expect(avisos).toEqual(['Falta la clave']);
    });

    it('quitar una tarjeta anterior a la abierta la deja abierta (es la misma)', async () => {
      await montar();
      editor.cambiarPestana('variables');
      editor.agregar(); editor.agregar();
      editor.cambiar(1, { clave: 'oro', etiqueta: 'Oro' });
      editor.cambiar(2, { clave: 'mana', etiqueta: 'Maná' });
      refrescar();

      editor.quitar(0);
      refrescar();

      expect(titulos()).toEqual(['Oro', 'Maná']);
      expect(abiertas()).toEqual([false, true]);
    });

    it('lo escrito en una tarjeta plegada no se pierde ni se guarda distinto', async () => {
      await montar();
      editor.cambiarPestana('variables');
      editor.agregar();
      editor.cambiar(1, { clave: 'oro', etiqueta: 'Oro' });
      editor.agregar();
      refrescar();

      // la de "Oro" está plegada, pero sus campos siguen ahí con su valor
      const campo = el().querySelector<HTMLInputElement>('#var-etiqueta-1')!;
      expect(campo.value).toBe('Oro');
      expect(campo.closest<HTMLElement>('[id^="tarjeta-plegable-"]')!.hidden).toBeTrue();
      expect(editor.filas[1].clave).toBe('oro');
    });

    it('cada lista lleva su propia tarjeta abierta: variables, objetos, ubicaciones, logros y finales', async () => {
      await montar();
      editor.cambiarPestana('variables'); editor.agregar();
      editor.cambiarPestana('objetos'); editor.agregarObjeto();
      editor.cambiarPestana('ubicaciones'); editor.agregarUbicacion();
      editor.cambiarPestana('metas'); editor.agregarMeta('logros'); editor.agregarMeta('finales');

      expect(editor.acordeon.esta('variables', 1)).toBeTrue();
      expect(editor.acordeon.esta('objetos', 1)).toBeTrue();
      expect(editor.acordeon.esta('ubicaciones', 0)).toBeTrue();
      expect(editor.acordeon.esta('logros', 0)).toBeTrue();
      expect(editor.acordeon.esta('finales', 0)).toBeTrue();
    });

    it('un objeto usable resume su uso, y la ubicación inicial se marca', async () => {
      await montar();
      editor.cambiarPestana('objetos');
      refrescar();
      expect(el().textContent).toContain('pocion · apilable');

      editor.alternarUso(0, true);
      editor.cambiarUso(0, { etiqueta: 'Beber' });
      refrescar();
      expect(el().textContent).toContain('se usa: Beber');
    });
  });
});
