import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EtiquetasInputComponent } from './etiquetas-input.component';
import { MAX_ETIQUETAS } from './escenas-etiquetas';

describe('EtiquetasInputComponent', () => {
  let fixture: ComponentFixture<EtiquetasInputComponent>;
  let emitidas: string[][];
  const el = () => fixture.nativeElement as HTMLElement;
  const campo = () => el().querySelector('input') as HTMLInputElement;

  async function montar(etiquetas: string[] = [], sugerencias: string[] = []) {
    await TestBed.configureTestingModule({ imports: [EtiquetasInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(EtiquetasInputComponent);
    fixture.componentRef.setInput('etiquetas', etiquetas);
    fixture.componentRef.setInput('sugerencias', sugerencias);
    emitidas = [];
    fixture.componentInstance.etiquetasChange.subscribe(e => emitidas.push(e));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function escribir(texto: string) {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  function tecla(key: string): KeyboardEvent {
    const evento = new KeyboardEvent('keydown', { key, cancelable: true });
    campo().dispatchEvent(evento);
    return evento;
  }

  it('Enter añade la etiqueta escrita, limpia el campo y no envía el formulario', async () => {
    await montar(['Acto 1']);
    await escribir('  Flashback ');

    const evento = tecla('Enter');

    expect(evento.defaultPrevented).toBeTrue();
    expect(emitidas).toEqual([['Acto 1', 'Flashback']]);

    // ngModel escribe el campo vacío en un microtask: hay que dejar que la vista se estabilice.
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(campo().value).toBe('');
  });

  it('escribe la etiqueta como la usan otras escenas si solo cambian las mayúsculas', async () => {
    await montar([], ['Acto 2']);
    await escribir('acto 2');

    tecla('Enter');

    expect(emitidas).toEqual([['Acto 2']]);
  });

  it('la coma también confirma', async () => {
    await montar();
    await escribir('Acto 1');

    expect(tecla(',').defaultPrevented).toBeTrue();
    expect(emitidas).toEqual([['Acto 1']]);
  });

  it('al salir del campo se añade lo que quedó escrito', async () => {
    await montar();
    await escribir('Acto 1');

    campo().dispatchEvent(new Event('blur'));

    expect(emitidas).toEqual([['Acto 1']]);
  });

  it('una etiqueta repetida (sin distinguir mayúsculas) o vacía no emite nada', async () => {
    await montar(['Acto 1']);

    await escribir('acto 1');
    tecla('Enter');
    await escribir('   ');
    tecla('Enter');

    expect(emitidas).toEqual([]);
  });

  it('Retroceso con el campo vacío quita la última; con texto no', async () => {
    await montar(['a', 'b']);

    await escribir('x');
    tecla('Backspace');
    expect(emitidas).toEqual([]);

    await escribir('');
    tecla('Backspace');
    expect(emitidas).toEqual([['a']]);
  });

  it('cada etiqueta tiene su botón para quitarla', async () => {
    await montar(['a', 'b']);

    (el().querySelector('[aria-label="Quitar la etiqueta a"]') as HTMLButtonElement).click();

    expect(emitidas).toEqual([['b']]);
  });

  it('al llegar al máximo el campo se desactiva', async () => {
    await montar(Array.from({ length: MAX_ETIQUETAS }, (_, i) => `e${i}`));

    expect(campo().disabled).toBeTrue();
  });

  it('solo sugiere las etiquetas que aún no están puestas', async () => {
    await montar(['Acto 1'], ['Acto 1', 'acto 2', 'Flashback']);

    const opciones = Array.from(el().querySelectorAll('datalist option')).map(o => (o as HTMLOptionElement).value);

    expect(opciones).toEqual(['acto 2', 'Flashback']);
    expect(campo().getAttribute('list')).toBe(el().querySelector('datalist')!.id);
  });
});
