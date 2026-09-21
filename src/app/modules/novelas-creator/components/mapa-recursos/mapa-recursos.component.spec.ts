import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MixRecursosType } from '@models/recurso.interfaces';
import { habla, selecciona } from 'src/app/shared/engine/engine-fixtures';
import { MapaRecursosComponent } from './mapa-recursos.component';

describe('MapaRecursosComponent', () => {
  let component: MapaRecursosComponent;
  let fixture: ComponentFixture<MapaRecursosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaRecursosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaRecursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('con enlaces hacia atrás', () => {
    // a → b → c → d(decide), y d vuelve a b (su abuelo) o sigue a e; d también apunta a sí mismo
    const recursos = (): MixRecursosType[] => [
      { ...habla('a', 'b'), primerRecurso: true },
      habla('b', 'c'),
      habla('c', 'd'),
      selecciona('d', [{ siguienteRecursoId: 'b' }, { siguienteRecursoId: 'e' }, { siguienteRecursoId: 'd' }, { siguienteRecursoId: 'b' }]),
      habla('e'),
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('recursos', recursos());
      component.ngOnChanges();
    });

    const enlace = (from: string, to: string, n = 0) => component.edges.get().filter(e => e.from === from && e.to === to)[n];
    const nodo = (id: string) => component.nodes.get(id)!;

    it('no usa el layout jerárquico: los nodos se pueden mover en los dos ejes', () => {
      expect(component.getNetworkOptions().layout).toEqual({ hierarchical: false });
    });

    it('todos los nodos llevan su posición calculada, un nivel por debajo del anterior', () => {
      const ys = ['a', 'b', 'c', 'd', 'e'].map(id => nodo(id).y);

      expect(ys.every(y => typeof y === 'number')).toBeTrue();
      expect(ys).toEqual([...ys].sort((p, q) => p! - q!));
      expect(new Set(ys).size).toBe(5);
    });

    it('el enlace que baja un nivel es recto', () => {
      expect(enlace('a', 'b').smooth).toBeUndefined();
      expect(enlace('c', 'd').smooth).toBeUndefined();
    });

    it('el enlace al abuelo se curva para no pasar por detrás de los nodos intermedios', () => {
      const smooth = enlace('d', 'b').smooth as { type: string; roundness: number };

      expect(smooth.type).toMatch(/^curved/);
      expect(smooth.roundness).toBeGreaterThan(0.3);
    });

    it('un enlace de un nodo a sí mismo no se curva (vis-network dibuja el bucle)', () => {
      expect(enlace('d', 'd').smooth).toBeUndefined();
    });

    it('dos enlaces al mismo destino no se dibujan uno sobre otro', () => {
      const a = enlace('d', 'b', 0).smooth as { type: string; roundness: number };
      const b = enlace('d', 'b', 1).smooth as { type: string; roundness: number };

      expect(a.type !== b.type || a.roundness !== b.roundness).toBeTrue();
    });

    it('reordenar olvida lo movido a mano y vuelve a calcular la disposición', () => {
      component['posicionesManuales'].set('c', { x: 999, y: 999 });
      component.ngOnChanges();
      expect(nodo('c').x).toBe(999);

      component.reordenar();

      expect(nodo('c').x).not.toBe(999);
      expect(component['posicionesManuales'].size).toBe(0);
    });
  });
});
