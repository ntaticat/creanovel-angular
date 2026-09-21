import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { IDefiniciones, IEstadoJuego, IObjetoDef, IVariableDef } from '@models/motor.interfaces';
import { cantidadDe, clamp, esValorValido, topeObjeto } from 'src/app/shared/engine/estado';

/**
 * Panel de la vista previa: muestra las variables del estado de juego y deja editarlas en vivo para
 * probar cada rama de la historia sin tener que jugar hasta ella.
 */
@Component({
  selector: 'app-motor-debug-panel',
  templateUrl: './motor-debug-panel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MotorDebugPanelComponent {
  @Input() definiciones: IDefiniciones = { variables: [] };
  @Input() estado: IEstadoJuego = { vars: {} };
  @Input() recursoActualId?: string;

  @Output() estadoCambiado = new EventEmitter<IEstadoJuego>();
  /** Variables iniciales y de vuelta al principio. */
  @Output() reiniciar = new EventEmitter<void>();
  /** De vuelta al principio pero conservando las variables tal como están (para probar una rama concreta). */
  @Output() irAlInicio = new EventEmitter<void>();

  cambiar(def: IVariableDef, valor: unknown): void {
    if (!esValorValido(valor, def)) {
      return;
    }

    const nuevo = def.tipo === 'numero' ? clamp(valor as number, def) : valor;
    this.estadoCambiado.emit({ ...this.estado, vars: { ...this.estado.vars, [def.clave]: nuevo } });
  }

  cantidad(def: IObjetoDef): number {
    return cantidadDe(this.estado, def.id);
  }

  tope(def: IObjetoDef): number {
    return topeObjeto(def);
  }

  cambiarCantidad(def: IObjetoDef, valor: number): void {
    if (!Number.isInteger(valor) || valor < 0) {
      return;
    }

    const inventario = { ...(this.estado.inventario ?? {}) };
    const acotado = Math.min(valor, topeObjeto(def));
    if (acotado > 0) inventario[def.id] = acotado;
    else delete inventario[def.id];
    this.estadoCambiado.emit({ ...this.estado, inventario });
  }

  cambiarUbicacion(id: string): void {
    this.estadoCambiado.emit({ ...this.estado, ubicacion: id || null });
  }
}
