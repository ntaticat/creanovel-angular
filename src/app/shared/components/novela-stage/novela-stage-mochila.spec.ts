import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IItemMochila } from 'src/app/shared/engine/motor';
import { NovelaStageComponent } from './novela-stage.component';

describe('NovelaStageComponent — mochila', () => {
  let fixture: ComponentFixture<NovelaStageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const item = (parcial: Partial<IItemMochila>): IItemMochila => ({
    id: 'pocion', nombre: 'Poción', descripcion: '', cantidad: 2, apilable: true, ...parcial,
  });
  const botonesDeUso = () => Array.from(el().querySelectorAll<HTMLButtonElement>('[role="dialog"] li button'));

  async function montar(mochila: IItemMochila[]) {
    await TestBed.configureTestingModule({ imports: [NovelaStageComponent] }).compileComponents();
    fixture = TestBed.createComponent(NovelaStageComponent);
    fixture.componentRef.setInput('mostrarMochila', true);
    fixture.componentRef.setInput('mochila', mochila);
    fixture.detectChanges();
    fixture.componentInstance.mochilaAbierta = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  }

  it('un objeto sin uso no muestra botón', async () => {
    await montar([item({})]);

    expect(botonesDeUso().length).toBe(0);
  });

  it('un objeto con uso muestra su botón y avisa al pulsarlo', async () => {
    await montar([item({ uso: { etiqueta: 'Beber', habilitado: true, llevaANodo: false } })]);
    const usados: string[] = [];
    fixture.componentInstance.objetoUsado.subscribe(id => usados.push(id));

    const [boton] = botonesDeUso();
    expect(boton.textContent?.trim()).toBe('Beber');
    boton.click();

    expect(usados).toEqual(['pocion']);
    expect(fixture.componentInstance.mochilaAbierta).toBeTrue();   // un efecto simple no cierra la mochila
  });

  it('si el uso lleva a otro nodo, la mochila se cierra sola', async () => {
    await montar([item({ id: 'mapa', uso: { etiqueta: 'Usar', habilitado: true, llevaANodo: true } })]);

    botonesDeUso()[0].click();

    expect(fixture.componentInstance.mochilaAbierta).toBeFalse();
  });

  it('un uso deshabilitado no se puede pulsar', async () => {
    await montar([item({ uso: { etiqueta: 'Usar', habilitado: false, llevaANodo: true } })]);
    const usados: string[] = [];
    fixture.componentInstance.objetoUsado.subscribe(id => usados.push(id));

    const [boton] = botonesDeUso();
    expect(boton.disabled).toBeTrue();
    fixture.componentInstance.usarObjeto(item({ uso: { etiqueta: 'Usar', habilitado: false, llevaANodo: true } }));

    expect(usados).toEqual([]);
    expect(fixture.componentInstance.mochilaAbierta).toBeTrue();
  });
});
