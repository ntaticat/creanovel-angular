import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { IEscena } from '@models/escena.interfaces';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { EscenasService } from '@services/escenas.service';
import { NovelasService } from '@services/novelas.service';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { RecursosService } from '@services/recursos.service';
import { NovelaCreatorPageComponent } from './novela-creator-page.component';

describe('NovelaCreatorPageComponent — etiquetas de escenas', () => {
  let fixture: ComponentFixture<NovelaCreatorPageComponent>;
  let page: NovelaCreatorPageComponent;
  const el = () => fixture.nativeElement as HTMLElement;

  const escena = (identificador: string, ...etiquetas: string[]) =>
    ({ escenaId: `id-${identificador}`, identificador, etiquetas, recursos: [] }) as unknown as IEscena;
  const version = (...escenas: IEscena[]): INovelaVersion =>
    ({ novelaVersionId: 'v1', novelaId: 'n1', numeroVersion: '1.0.0', disponible: false, esBorrador: true, escenas });

  const intro = escena('intro', 'Acto 1');
  const bosque = escena('bosque', 'Acto 1', 'Flashback');
  const duelo = escena('duelo', 'Acto 2');
  const epilogo = escena('epilogo');

  async function montar(v: INovelaVersion) {
    await TestBed.configureTestingModule({
      imports: [NovelaCreatorPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of({ novelaVersionId: 'v1' }) } },
        { provide: NovelasVersionesService, useValue: { getNovelaVersion: () => of(v) } },
        { provide: NovelasService, useValue: { getNovela: () => of({ personajes: [], backgrounds: [] }) } },
        { provide: EscenasService, useValue: { getEscena: (id: string) => of([intro, bosque, duelo, epilogo].find(e => e.escenaId === id)) } },
        { provide: RecursosService, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NovelaCreatorPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  async function refrescar() {
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const nav = () => el().querySelector('nav[aria-label="Escenas"]') as HTMLElement;
  const chips = () => Array.from(nav().querySelectorAll('[role="group"] button[aria-pressed]')).map(b => b as HTMLButtonElement);
  const chip = (nombre: string) => chips().find(b => b.textContent!.trim() === nombre)!;
  /** Los botones de escena (los que abren la escena), sin los chips ni "Agrupar". */
  const botonesEscena = () =>
    Array.from(nav().querySelectorAll('button:not([aria-pressed])'))
      .map(b => (b.firstChild?.textContent ?? '').trim())
      .filter(t => ['intro', 'bosque', 'duelo', 'epilogo'].includes(t));
  const encabezados = () => Array.from(nav().querySelectorAll('div.font-semibold')).map(d => d.textContent!.replace(/\s+/g, ' ').trim());

  it('sin ninguna etiqueta no hay filtro ni botón de agrupar', async () => {
    await montar(version(escena('a'), escena('b')));

    expect(chips()).toEqual([]);
    expect(nav().textContent).not.toContain('Agrupar');
  });

  it('muestra un chip por etiqueta (sin repetir) y todas las escenas', async () => {
    await montar(version(intro, bosque, duelo, epilogo));

    expect(chips().map(c => c.textContent!.trim())).toEqual(['Acto 1', 'Acto 2', 'Flashback']);
    expect(botonesEscena()).toEqual(['intro', 'bosque', 'duelo', 'epilogo']);
  });

  it('cada escena enseña sus etiquetas bajo el nombre', async () => {
    await montar(version(intro, bosque));

    expect(nav().textContent).toContain('Acto 1 · Flashback');
  });

  it('elegir una etiqueta deja solo las escenas que la tienen y marca el chip', async () => {
    await montar(version(intro, bosque, duelo, epilogo));

    chip('Acto 1').click();
    await refrescar();

    expect(botonesEscena()).toEqual(['intro', 'bosque']);
    expect(chip('Acto 1').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Acto 2').getAttribute('aria-pressed')).toBe('false');
  });

  it('elegir varias muestra la unión y "Quitar filtro" las devuelve todas', async () => {
    await montar(version(intro, bosque, duelo, epilogo));

    chip('Acto 2').click();
    chip('Flashback').click();
    await refrescar();
    expect(botonesEscena()).toEqual(['bosque', 'duelo']);

    (Array.from(nav().querySelectorAll('button')).find(b => b.textContent!.includes('Quitar filtro')) as HTMLButtonElement).click();
    await refrescar();
    expect(botonesEscena()).toEqual(['intro', 'bosque', 'duelo', 'epilogo']);
  });

  it('agrupar reparte las escenas por etiqueta (una escena en cada una) y las sin etiqueta al final', async () => {
    await montar(version(intro, bosque, duelo, epilogo));

    page.onToggleAgrupar();
    await refrescar();

    expect(encabezados()).toEqual(['Acto 1 (2)', 'Acto 2 (1)', 'Flashback (1)', 'Sin etiqueta (1)']);
    expect(botonesEscena()).toEqual(['intro', 'bosque', 'duelo', 'bosque', 'epilogo']);
  });

  it('agrupar con un filtro activo solo forma los grupos elegidos', async () => {
    await montar(version(intro, bosque, duelo, epilogo));

    page.onToggleAgrupar();
    chip('Acto 1').click();
    await refrescar();

    expect(encabezados()).toEqual(['Acto 1 (2)']);
    expect(botonesEscena()).toEqual(['intro', 'bosque']);
  });

  it('si la etiqueta elegida deja de existir, el filtro se limpia y vuelven todas las escenas', async () => {
    await montar(version(intro, bosque, duelo, epilogo));
    chip('Flashback').click();
    await refrescar();
    expect(botonesEscena()).toEqual(['bosque']);

    // El autor le quita "Flashback" a la única escena que la tenía.
    (page as unknown as { novelaInfo: INovelaVersion }).novelaInfo = version(intro, escena('bosque', 'Acto 1'), duelo, epilogo);
    (page as unknown as { recalcularListaEscenas(): void }).recalcularListaEscenas();
    await refrescar();

    expect(page.etiquetasSeleccionadas).toEqual([]);
    expect(botonesEscena()).toEqual(['intro', 'bosque', 'duelo', 'epilogo']);
  });

  it('el botón de editar la escena solo aparece con una escena abierta y abre el formulario con sus etiquetas', async () => {
    await montar(version(intro, bosque));
    const editar = () => el().querySelector('[aria-label="Editar la escena y sus etiquetas"]');
    expect(editar()).toBeNull();

    page.onClickEscena('id-bosque');
    await refrescar();
    (editar() as HTMLButtonElement).click();
    await refrescar();

    expect(el().textContent).toContain('Editar Escena');
    expect((el().querySelector('#escena-identificador') as HTMLInputElement).value).toBe('bosque');
    expect(el().textContent).toContain('Flashback');
  });
});
