import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICondicion, IDefiniciones, IEfecto } from '@models/motor.interfaces';
import { SintaxisCampoComponent } from './sintaxis-campo.component';

describe('SintaxisCampoComponent', () => {
  const defs: IDefiniciones = {
    variables: [
      { clave: 'salud', etiqueta: 'Salud', tipo: 'numero', valores: [], hud: 'oculto' },
      { clave: 'tiene_pareja', etiqueta: 'Pareja', tipo: 'booleano', valores: [], hud: 'oculto' },
    ],
    objetos: [{ id: 'llave', nombre: 'Llave', descripcion: '', apilable: false, inicial: 0 }],
    ubicaciones: [{ id: 'patio', nombre: 'Patio' }],
  };
  let fixture: ComponentFixture<SintaxisCampoComponent>;
  let componente: SintaxisCampoComponent;
  let condiciones: (ICondicion | null)[];
  let efectos: IEfecto[][];

  async function montar(modo: 'condicion' | 'efectos', valor?: ICondicion | IEfecto[] | null) {
    await TestBed.configureTestingModule({ imports: [SintaxisCampoComponent] }).compileComponents();
    fixture = TestBed.createComponent(SintaxisCampoComponent);
    componente = fixture.componentInstance;
    condiciones = [];
    efectos = [];
    componente.condicionChange.subscribe(c => condiciones.push(c));
    componente.efectosChange.subscribe(e => efectos.push(e));
    fixture.componentRef.setInput('modo', modo);
    fixture.componentRef.setInput('definiciones', defs);
    if (modo === 'condicion') fixture.componentRef.setInput('condicion', valor as ICondicion | null);
    else fixture.componentRef.setInput('efectos', valor as IEfecto[] | null);
    fixture.detectChanges();
  }

  const area = () => fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const escribir = (texto: string) => {
    area().value = texto;
    area().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  describe('condición', () => {
    it('muestra la condición recibida como texto', async () => {
      await montar('condicion', { y: [{ var: 'salud', op: '>=', valor: 50 }, { no: { en: 'patio' } }] });

      expect(area().value).toBe('salud >= 50 y no en patio');
    });

    it('sin condición el campo está vacío', async () => {
      await montar('condicion', null);

      expect(area().value).toBe('');
    });

    it('lo escrito, si se entiende, se emite como condición y se confirma', async () => {
      await montar('condicion');
      escribir('salud < 30 o tengo llave');

      expect(condiciones).toEqual([{ o: [{ var: 'salud', op: '<', valor: 30 }, { objeto: 'llave', op: '>=', valor: 1 }] }]);
      expect(texto()).toContain('Se entiende');
    });

    it('lo escrito, si no se entiende, muestra el problema y no emite nada', async () => {
      await montar('condicion');
      escribir('sald < 30');

      expect(condiciones).toEqual([]);
      expect(texto()).toContain('No se entiende');
      expect(texto()).toContain('«sald» no está definida');
      expect(texto()).toContain('columna 1');
      expect(area().getAttribute('aria-invalid')).toBe('true');
    });

    it('borrar todo emite «sin condición»', async () => {
      await montar('condicion', { en: 'patio' });
      escribir('');

      expect(condiciones).toEqual([null]);
    });

    it('un error seguido de una corrección vuelve a emitir y quita el aviso', async () => {
      await montar('condicion');
      escribir('sald < 30');
      escribir('salud < 30');

      expect(condiciones).toEqual([{ var: 'salud', op: '<', valor: 30 }]);
      expect(texto()).not.toContain('No se entiende');
      expect(area().getAttribute('aria-invalid')).toBeNull();
    });

    it('lo que el padre devuelve tras emitir no reescribe lo que se está tecleando', async () => {
      await montar('condicion');
      escribir('tiene_pareja');
      // El padre recibe la condición y la pasa de vuelta: el texto sigue siendo el escrito, no su forma canónica.
      fixture.componentRef.setInput('condicion', condiciones[0]);
      fixture.detectChanges();

      expect(area().value).toBe('tiene_pareja');
      escribir('tiene_pareja == verdadero');
      fixture.componentRef.setInput('condicion', condiciones[1]);
      fixture.detectChanges();

      expect(area().value).toBe('tiene_pareja == verdadero');
    });

    it('un cambio externo (otra condición) sí reescribe el texto', async () => {
      await montar('condicion', { en: 'patio' });

      fixture.componentRef.setInput('condicion', { logro: 'x' });
      fixture.detectChanges();

      expect(area().value).toBe('logro x');
    });

    it('admite lo que el editor visual no puede mostrar: grupos anidados', async () => {
      await montar('condicion');
      escribir('(salud > 1 o tiene_pareja) y (en patio o tengo llave)');

      expect(condiciones.length).toBe(1);
      expect((condiciones[0] as { y: ICondicion[] }).y.length).toBe(2);
    });
  });

  describe('efectos', () => {
    it('muestra los efectos recibidos uno por línea', async () => {
      await montar('efectos', [{ var: 'salud', op: 'restar', valor: 10 }, { objeto: 'llave', op: 'dar' }]);

      expect(area().value).toBe('salud -= 10\ndar llave');
    });

    it('lo escrito, si se entiende, se emite como lista de efectos', async () => {
      await montar('efectos');
      escribir('salud += 5; ir patio');

      expect(efectos).toEqual([[{ var: 'salud', op: 'sumar', valor: 5 }, { ir: 'patio' }]]);
    });

    it('con errores no se emite una lista a medias y se indica la línea', async () => {
      await montar('efectos');
      escribir('salud += 5\nir patioo');

      expect(efectos).toEqual([]);
      expect(texto()).toContain('línea 2');
    });

    it('un texto vacío emite una lista vacía', async () => {
      await montar('efectos', [{ ir: 'patio' }]);
      escribir('');

      expect(efectos).toEqual([[]]);
    });

    it('el campo crece con las líneas', async () => {
      await montar('efectos');
      escribir('a\nb\nc\nd\ne');

      expect(componente.filas).toBeGreaterThan(3);
      expect(componente.filas).toBeLessThanOrEqual(8);
    });
  });

  describe('insertar', () => {
    const insertar = (valor: string) => {
      const seleccion = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
      seleccion.innerHTML = `<option value="${valor}">${valor}</option>`;
      seleccion.value = valor;
      componente.insertar(seleccion);
      fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
      fixture.detectChanges();
    };

    it('ofrece las claves definidas y las palabras del modo', async () => {
      await montar('condicion');
      const opciones = Array.from(fixture.nativeElement.querySelectorAll('option')).map(o => (o as HTMLOptionElement).value);

      expect(opciones).toEqual(jasmine.arrayContaining(['salud', 'llave', 'patio', 'y', 'tengo']));
      expect(opciones).not.toContain('dar');
    });

    it('en efectos ofrece los verbos', async () => {
      await montar('efectos');
      const opciones = Array.from(fixture.nativeElement.querySelectorAll('option')).map(o => (o as HTMLOptionElement).value);

      expect(opciones).toEqual(jasmine.arrayContaining(['dar', 'quitar', 'ir', 'avanzar']));
      expect(opciones).not.toContain('y');
    });

    it('inserta en el punto del cursor, con espacios donde hacen falta, y vuelve a leer el texto', async () => {
      await montar('condicion');
      escribir('salud > 1 y ');
      area().setSelectionRange(area().value.length, area().value.length);

      insertar('tiene_pareja');

      expect(area().value).toBe('salud > 1 y tiene_pareja');
      expect(condiciones[condiciones.length - 1]).toEqual({
        y: [{ var: 'salud', op: '>', valor: 1 }, { var: 'tiene_pareja', op: '==', valor: true }],
      });
    });

    it('insertar en mitad del texto separa con espacios', async () => {
      await montar('condicion');
      escribir('salud > 1 tiene_pareja');
      area().setSelectionRange(9, 9);

      insertar('y');

      expect(area().value).toBe('salud > 1 y tiene_pareja');
    });
  });
});
