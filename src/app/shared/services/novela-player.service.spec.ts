import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { IPersonaje } from '@models/personaje.interfaces';
import { habla } from 'src/app/shared/engine/engine-fixtures';
import { NovelaPlayerService } from './novela-player.service';

describe('NovelaPlayerService.resolverArte — personajes en escena', () => {
  let servicio: NovelaPlayerService;

  const personajes: IPersonaje[] = [
    {
      personajeId: 'ana',
      nombre: 'Ana',
      sprites: [
        { personajeSpriteId: 's-feliz', nombre: 'feliz', direccionImagen: 'https://cdn.test/ana-feliz.png' },
        { personajeSpriteId: 's-triste', nombre: 'triste', direccionImagen: 'https://cdn.test/ana-triste.png' },
      ],
    },
    { personajeId: 'beto', nombre: 'Beto', sprites: [{ personajeSpriteId: 's-beto', nombre: 'normal', direccionImagen: 'https://cdn.test/beto.png' }] },
  ];
  const en = (personajeSpriteId: string, x = 50) => ({ personajeSpriteId, x, y: 50, escala: 1, espejo: false });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(NovelaPlayerService);
  });

  it('un nodo sin personajes no dibuja ninguno', () => {
    const arte = servicio.resolverArte(habla('a'), personajes, []);

    expect(arte.personajes).toBeUndefined();
    expect(arte.personajeNombre).toBeUndefined();
  });

  it('devuelve todos los personajes colocados, en su orden de apilado y con su colocación', () => {
    const recurso = { ...habla('a'), personajes: [
      { personajeSpriteId: 's-beto', x: 70, y: 55, escala: 1.4, espejo: true },
      en('s-feliz', 20),
    ] };

    const arte = servicio.resolverArte(recurso, personajes, []);

    expect(arte.personajes?.map(p => [p.nombre, p.url, p.x, p.escala, p.espejo])).toEqual([
      ['Beto', 'https://cdn.test/beto.png', 70, 1.4, true],
      ['Ana', 'https://cdn.test/ana-feliz.png', 20, 1, false],
    ]);
  });

  it('con un solo personaje (aunque sean varios sprites suyos) él es quien habla', () => {
    const recurso = { ...habla('a'), personajes: [en('s-feliz', 30), en('s-triste', 70)] };

    expect(servicio.resolverArte(recurso, personajes, []).personajeNombre).toBe('Ana');
  });

  it('con varios personajes distintos no se sabe quién habla: se usa el autor escrito en el nodo', () => {
    const recurso = { ...habla('a'), personajes: [en('s-feliz'), en('s-beto')] };

    expect(servicio.resolverArte(recurso, personajes, []).personajeNombre).toBeUndefined();
  });

  it('un sprite que ya no existe se omite sin romper los demás', () => {
    const recurso = { ...habla('a'), personajes: [en('s-borrado'), en('s-beto')] };

    const arte = servicio.resolverArte(recurso, personajes, []);

    expect(arte.personajes?.map(p => p.nombre)).toEqual(['Beto']);
  });

  it('el mismo sprite puede aparecer varias veces', () => {
    const recurso = { ...habla('a'), personajes: [en('s-beto', 20), en('s-beto', 80)] };

    expect(servicio.resolverArte(recurso, personajes, []).personajes?.map(p => p.x)).toEqual([20, 80]);
  });
});
