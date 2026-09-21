import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICondicion, IDefiniciones } from '@models/motor.interfaces';
import { CondicionBuilderComponent } from './condicion-builder.component';

describe('CondicionBuilderComponent (modo texto)', () => {
  const defs: IDefiniciones = {
    variables: [
      { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', valores: [], hud: 'oculto' },
      { clave: 'pareja', etiqueta: 'Pareja', tipo: 'booleano', valores: [], hud: 'oculto' },
    ],
    ubicaciones: [{ id: 'patio', nombre: 'Patio' }],
  };
  let fixture: ComponentFixture<CondicionBuilderComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const boton = () => el().querySelector('button[aria-pressed]') as HTMLButtonElement;

  async function montar(condicion: ICondicion | null) {
    localStorage.removeItem('creanovel.editor.sintaxis');
    await TestBed.configureTestingModule({ imports: [CondicionBuilderComponent] }).compileComponents();
    fixture = TestBed.createComponent(CondicionBuilderComponent);
    fixture.componentRef.setInput('condicion', condicion);
    fixture.componentRef.setInput('definiciones', defs);
    fixture.detectChanges();
  }

  afterEach(() => localStorage.removeItem('creanovel.editor.sintaxis'));

  it('por defecto se edita con el editor visual y se puede pasar a texto', async () => {
    await montar({ var: 'salud', op: '>=', valor: 50 });

    expect(el().querySelector('textarea')).toBeNull();
    expect(boton().textContent).toContain('Escribir como texto');

    boton().click();
    fixture.detectChanges();

    expect(el().querySelector('textarea')).not.toBeNull();
    expect((el().querySelector('textarea') as HTMLTextAreaElement).value).toBe('salud >= 50');
    expect(boton().textContent).toContain('Editor visual');
  });

  it('el modo elegido se recuerda para los siguientes editores', async () => {
    await montar(null);
    boton().click();

    expect(localStorage.getItem('creanovel.editor.sintaxis')).toBe('texto');
    fixture.destroy();
    fixture = TestBed.createComponent(CondicionBuilderComponent);
    fixture.componentRef.setInput('definiciones', defs);
    fixture.detectChanges();

    expect(el().querySelector('textarea')).not.toBeNull();
  });

  it('una condición con grupos anidados se abre como texto y no permite volver al visual', async () => {
    await montar({ y: [{ var: 'salud', op: '>', valor: 1 }, { o: [{ var: 'pareja', op: '==', valor: true }, { en: 'patio' }] }] });

    const area = el().querySelector('textarea') as HTMLTextAreaElement;
    expect(area.value).toBe('salud > 1 y (pareja o en patio)');
    expect(boton().disabled).toBeTrue();
  });

  it('escribir en modo texto emite la condición', async () => {
    await montar(null);
    boton().click();
    fixture.detectChanges();
    const emitidas: (ICondicion | null)[] = [];
    fixture.componentInstance.condicionChange.subscribe(c => emitidas.push(c));

    const area = el().querySelector('textarea') as HTMLTextAreaElement;
    area.value = 'en patio y no pareja';
    area.dispatchEvent(new Event('input'));

    expect(emitidas).toEqual([{ y: [{ en: 'patio' }, { no: { var: 'pareja', op: '==', valor: true } }] }]);
  });

  it('las reglas de logro y de final se editan en el editor visual', async () => {
    localStorage.removeItem('creanovel.editor.sintaxis');
    await TestBed.configureTestingModule({ imports: [CondicionBuilderComponent] }).compileComponents();
    fixture = TestBed.createComponent(CondicionBuilderComponent);
    fixture.componentRef.setInput('definiciones', {
      variables: [],
      logros: [{ id: 'valiente', nombre: 'Valiente', descripcion: '' }],
      finales: [{ id: 'bueno', nombre: 'Bueno', descripcion: '' }],
    });
    fixture.componentRef.setInput('condicion', { y: [{ logro: 'valiente' }, { no: { final: 'bueno' } }] });
    fixture.detectChanges();

    const selects = Array.from(el().querySelectorAll('select[aria-label="Qué se comprueba"]')) as HTMLSelectElement[];
    expect(selects.map(s => s.value)).toEqual(['logro:valiente', 'final:bueno']);
    expect((el().querySelectorAll('input[type=checkbox]')[1] as HTMLInputElement).checked).toBeTrue();   // el «no» de la segunda regla
  });
});
