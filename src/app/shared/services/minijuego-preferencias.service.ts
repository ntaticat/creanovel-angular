import { Injectable } from '@angular/core';

/** Factor de tiempo del modo "más tiempo" (los minijuegos temporizados duran x2,5 y el marcador va más lento). */
export const FACTOR_MAS_TIEMPO = 2.5;

/**
 * Preferencias de accesibilidad de los minijuegos. Se recuerdan entre partidas en este navegador; si el almacenamiento
 * no está disponible (modo privado, bloqueado) la preferencia solo vale mientras dure la página.
 */
@Injectable({ providedIn: 'root' })
export class MinijuegoPreferenciasService {
  private readonly clave = 'creanovel.minijuegos.mas-tiempo';
  private enMemoria = false;

  get masTiempo(): boolean {
    try {
      return localStorage.getItem(this.clave) === '1';
    } catch {
      return this.enMemoria;
    }
  }

  set masTiempo(valor: boolean) {
    this.enMemoria = valor;
    try {
      localStorage.setItem(this.clave, valor ? '1' : '0');
    } catch {
      // Sin almacenamiento: queda en memoria.
    }
  }

  get factorTiempo(): number {
    return this.masTiempo ? FACTOR_MAS_TIEMPO : 1;
  }
}
