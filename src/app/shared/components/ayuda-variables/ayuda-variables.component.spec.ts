import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { IDefiniciones } from '@models/motor.interfaces';
import { AyudaVariablesComponent } from './ayuda-variables.component';

describe('AyudaVariablesComponent', () => {
  const defs: IDefiniciones = {
    variables: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', inicial: 'Ana', valores: [], hud: 'oculto' },
      { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', inicial: 90, valores: [], hud: 'oculto' },
    ],
    objetos: [{ id: 'llave', nombre: 'Llave', descripcion: '', apilable: false, inicial: 0 }],
    ubicaciones: [{ id: 'patio', nombre: 'Patio' }],
    ubicacionInicial: 'patio',
  };
  let fixture: ComponentFixture<AyudaVariablesComponent>;
  let control: FormControl<string>;
  let campo: HTMLTextAreaElement;
  const el = () => fixture.nativeElement as HTMLElement;

  async function montar(texto: string, definiciones: IDefiniciones | null = defs) {
    await TestBed.configureTestingModule({ imports: [AyudaVariablesComponent] }).compileComponents();
    fixture = TestBed.createComponent(AyudaVariablesComponent);
    control = new FormControl(texto, { nonNullable: true });
    campo = document.createElement('textarea');
    campo.value = texto;
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('campo', campo);
    fixture.componentRef.setInput('definiciones', definiciones);
    fixture.detectChanges();
  }

  it('no muestra nada si no hay qué insertar y el texto no usa llaves', async () => {
    await montar('Hola', { variables: [] });

    expect(el().textContent?.trim()).toBe('');
  });

  it('muestra el texto tal como se leería con los valores iniciales', async () => {
    await montar('Hola {nombre}, {salud} de salud, en {ubicacion}.');

    expect(el().textContent).toContain('Al empezar se lee:');
    expect(el().textContent).toContain('Hola Ana, 90 de salud, en Patio.');
  });

  it('no muestra la vista si el texto no tiene llaves', async () => {
    await montar('Hola');

    expect(el().textContent).not.toContain('Al empezar se lee');
  });

  it('avisa de lo que no existe', async () => {
    await montar('Hola {nomre} y {objeto:espada}');

    expect(el().textContent).toContain('«nomre» no está definida');
    expect(el().textContent).toContain('«espada» no está definido');
  });

  it('ofrece variables, objetos, ubicación actual y texto condicional', async () => {
    await montar('');
    const valores = Array.from(el().querySelectorAll('option')).map(o => (o as HTMLOptionElement).value);

    expect(valores).toEqual(jasmine.arrayContaining(['{nombre}', '{salud}', '{objeto:llave}', '{ubicacion}']));
    expect(valores.some(v => v.startsWith('{si '))).toBeTrue();
  });

  it('inserta en el punto del cursor y actualiza el campo del formulario', async () => {
    await montar('Hola , adiós');
    campo.setSelectionRange(5, 5);
    const seleccion = el().querySelector('select') as HTMLSelectElement;
    seleccion.innerHTML = '<option value="{nombre}">x</option>';
    seleccion.value = '{nombre}';

    fixture.componentInstance.insertar(seleccion);

    expect(control.value).toBe('Hola {nombre}, adiós');
    expect(control.dirty).toBeTrue();
    expect(seleccion.value).toBe('');
  });

  it('sin cursor conocido inserta al final', async () => {
    await montar('Hola ');
    fixture.componentRef.setInput('campo', null);
    const seleccion = el().querySelector('select') as HTMLSelectElement;
    seleccion.innerHTML = '<option value="{salud}">x</option>';
    seleccion.value = '{salud}';

    fixture.componentInstance.insertar(seleccion);

    expect(control.value).toBe('Hola {salud}');
  });

  it('elegir la opción vacía no cambia nada', async () => {
    await montar('Hola');
    const seleccion = el().querySelector('select') as HTMLSelectElement;
    seleccion.value = '';

    fixture.componentInstance.insertar(seleccion);

    expect(control.value).toBe('Hola');
  });
});
