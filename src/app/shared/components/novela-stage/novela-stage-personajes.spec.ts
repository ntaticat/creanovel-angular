import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IRecursoArte } from 'src/app/shared/services/novela-player.service';
import { NovelaStageComponent } from './novela-stage.component';

describe('NovelaStageComponent — personajes en escena', () => {
  let fixture: ComponentFixture<NovelaStageComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const imagenes = () => Array.from(el().querySelectorAll<HTMLImageElement>('img'));
  const vista = (nombre: string, parcial = {}) => ({
    personajeSpriteId: nombre, nombre, url: `https://cdn.test/${nombre}.png`, x: 50, y: 50, escala: 1, espejo: false, ...parcial,
  });

  async function montar(arte: IRecursoArte) {
    await TestBed.configureTestingModule({ imports: [NovelaStageComponent] }).compileComponents();
    fixture = TestBed.createComponent(NovelaStageComponent);
    fixture.componentRef.setInput('arte', arte);
    fixture.detectChanges();
  }

  it('sin personajes no dibuja ninguna imagen', async () => {
    await montar({});

    expect(imagenes().length).toBe(0);
  });

  it('dibuja cada personaje, en orden (el último queda encima), con su nombre como texto alternativo', async () => {
    await montar({ personajes: [vista('Ana', { x: 25 }), vista('Beto', { x: 75 })] });

    expect(imagenes().map(i => [i.alt, i.getAttribute('src')])).toEqual([
      ['Ana', 'https://cdn.test/Ana.png'],
      ['Beto', 'https://cdn.test/Beto.png'],
    ]);
  });

  it('cada sprite se ve entero (sin recorte) y se coloca con el mismo estilo que usa el editor', async () => {
    await montar({ personajes: [vista('Ana', { x: 25, y: 80, escala: 1.5, espejo: true })] });

    const imagen = imagenes()[0];
    const contenedor = imagen.parentElement as HTMLElement;
    expect(imagen.classList).toContain('object-contain');
    expect(imagen.classList).not.toContain('object-cover');
    expect(contenedor.style.transform).toBe('translate(-25%, 30%) scale(-1.5, 1.5)');
  });

  describe('proporción del escenario', () => {
    it('con personajes colocados es siempre 16:9, para verse como en el editor también en móvil', async () => {
      await montar({ personajes: [vista('Ana')] });

      expect(fixture.componentInstance.claseEscenario).toBe('aspect-video');
    });

    it('sin personajes conserva el formato de siempre (4:5 en móvil)', async () => {
      await montar({});

      expect(fixture.componentInstance.claseEscenario).toContain('aspect-[4/5]');
    });
  });

  it('los personajes no capturan los clics: las zonas y los botones de debajo siguen funcionando', async () => {
    await montar({ personajes: [vista('Ana')] });

    expect(imagenes()[0].parentElement!.classList).toContain('pointer-events-none');
  });
});
