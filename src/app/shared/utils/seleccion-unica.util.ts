/**
 * Qué tarjeta está abierta en cada lista de un formulario: como mucho una por lista, para que el editor no se llene de campos abiertos.
 *
 * Las listas se identifican por nombre (`'variables'`, `'objetos'`...) y las tarjetas por su posición, así que hay que avisar
 * cuando una se quita para que la abierta siga siendo la misma (`alQuitar`). Al añadir una, se abre: el autor va a rellenarla.
 */
export class SeleccionUnica {
  private readonly abiertas = new Map<string, number>();

  esta(lista: string, indice: number): boolean {
    return this.abiertas.get(lista) === indice;
  }

  /** Abre la tarjeta (y cierra la que hubiera abierta en esa lista) o, con `abierta = false`, la cierra. */
  fijar(lista: string, indice: number, abierta: boolean): void {
    if (abierta) {
      this.abiertas.set(lista, indice);
    } else if (this.esta(lista, indice)) {
      this.abiertas.delete(lista);
    }
  }

  cerrar(lista: string): void {
    this.abiertas.delete(lista);
  }

  /** Una tarjeta se quitó de la lista: si era la abierta se cierra y si estaba después, sigue siendo la misma con otra posición. */
  alQuitar(lista: string, indice: number): void {
    const abierta = this.abiertas.get(lista);
    if (abierta === undefined) {
      return;
    }
    if (abierta === indice) {
      this.abiertas.delete(lista);
    } else if (abierta > indice) {
      this.abiertas.set(lista, abierta - 1);
    }
  }
}
