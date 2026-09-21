import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { IBackground } from '@models/background.interfaces';
import { IPersonaje } from '@models/personaje.interfaces';
import { IPersonajeEnEscena, MixRecursosType } from '@models/recurso.interfaces';
import { NovelasService } from '@services/novelas.service';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { UploadsService } from '@services/uploads.service';
import { IColocacionSprite } from 'src/app/shared/utils/sprite-escenario.util';

/** Un personaje ya resuelto para dibujarlo en el escenario. */
export interface IPersonajeVista extends IColocacionSprite {
  personajeSpriteId: string;
  nombre: string;
  url: string;
}

export interface IRecursoArte {
  /**
   * Nombre del personaje cuando en el escenario hay uno solo (o varios sprites del mismo personaje): es quien habla.
   * Con varios personajes distintos no se sabe quién habla, y se usa el autor escrito en el nodo.
   */
  personajeNombre?: string;
  /** De atrás hacia delante: el último se dibuja encima. */
  personajes?: IPersonajeVista[];
  backgroundUrl?: string;
}

/**
 * Resuelve los personajes colocados en un nodo a lo que hay que dibujar (imagen, nombre y colocación). Lo comparten el escenario del jugador
 * y los editores del nodo, así todos dibujan lo mismo. Un sprite que ya no existe (se borró de la biblioteca) simplemente no se dibuja.
 */
export function vistasDePersonajes(
  colocados: IPersonajeEnEscena[],
  personajes: IPersonaje[],
  resolverUrl: (url: string) => string
): IPersonajeVista[] {
  const vistas: IPersonajeVista[] = [];
  for (const colocado of colocados) {
    const dueno = personajes.find(p => (p.sprites || []).some(s => s.personajeSpriteId === colocado.personajeSpriteId));
    const sprite = dueno?.sprites.find(s => s.personajeSpriteId === colocado.personajeSpriteId);
    if (dueno && sprite) {
      vistas.push({
        personajeSpriteId: sprite.personajeSpriteId,
        nombre: dueno.nombre,
        url: resolverUrl(sprite.direccionImagen),
        x: colocado.x,
        y: colocado.y,
        escala: colocado.escala,
        espejo: colocado.espejo,
      });
    }
  }
  return vistas;
}

/**
 * Entry-point resolution, id->recurso indexing, and sprite-art lookup shared
 * between the reader (playing-novela) and the draft preview (testing-novela).
 * Links between recursos can cross escena boundaries freely, so playback must
 * treat the version as a flat graph keyed by recursoId rather than assuming
 * escena-by-escena progression.
 */
@Injectable({
  providedIn: 'root',
})
export class NovelaPlayerService {
  constructor(
    private novelasService: NovelasService,
    private novelasVersionesService: NovelasVersionesService,
    private uploadsService: UploadsService
  ) {}

  cargarVersionPublicada(novelaId: string): Observable<INovelaVersion> {
    return this.novelasService.getNovela(novelaId, 'True').pipe(
      switchMap(novela => {
        const publicada = novela.versiones?.find(v => v.disponible);
        if (!publicada) {
          return throwError(
            () => new Error('La novela no tiene una versión publicada')
          );
        }
        return this.novelasVersionesService.getNovelaVersion(
          publicada.novelaVersionId
        );
      })
    );
  }

  cargarBorrador(novelaId: string): Observable<INovelaVersion> {
    return this.novelasVersionesService.getNovelaVersiones(novelaId).pipe(
      switchMap(versiones => {
        const borrador = versiones.find(v => v.esBorrador);
        if (!borrador) {
          return throwError(
            () => new Error('La novela no tiene un borrador')
          );
        }
        return this.novelasVersionesService.getNovelaVersion(
          borrador.novelaVersionId
        );
      })
    );
  }

  construirMapaRecursos(version: INovelaVersion): Map<string, MixRecursosType> {
    const mapa = new Map<string, MixRecursosType>();
    (version.escenas || []).forEach(escena => {
      (escena.recursos || []).forEach(recurso => mapa.set(recurso.recursoId, recurso));
    });
    return mapa;
  }

  resolverRecursoInicial(version: INovelaVersion): MixRecursosType | undefined {
    const escenas = version.escenas || [];
    const primeraEscena = escenas.find(e => e.primerEscena) || escenas[0];
    if (!primeraEscena || !primeraEscena.recursos?.length) {
      return undefined;
    }
    return (
      primeraEscena.recursos.find(r => r.primerRecurso) ||
      primeraEscena.recursos[0]
    );
  }

  /**
   * `fondoPorDefectoId` es el fondo de la ubicación actual: se usa cuando el recurso no trae uno propio,
   * así un Habla en la biblioteca se ve en la biblioteca sin repetir el fondo en cada nodo.
   */
  resolverArte(
    recurso: MixRecursosType,
    personajes: IPersonaje[],
    backgrounds: IBackground[],
    fondoPorDefectoId?: string | null
  ): IRecursoArte {
    const arte: IRecursoArte = {};

    const vistas = vistasDePersonajes(recurso.personajes ?? [], personajes, url => this.uploadsService.resolveUrl(url));

    if (vistas.length) {
      arte.personajes = vistas;
      const nombres = new Set(vistas.map(v => v.nombre));
      if (nombres.size === 1) {
        arte.personajeNombre = vistas[0].nombre;
      }
    }

    const fondoId = recurso.backgroundSpriteId || fondoPorDefectoId;
    for (const background of backgrounds) {
      const sprite = (background.sprites || []).find(
        s => s.backgroundSpriteId === fondoId
      );
      if (sprite) {
        arte.backgroundUrl = this.uploadsService.resolveUrl(sprite.direccionImagen);
        break;
      }
    }

    return arte;
  }
}
