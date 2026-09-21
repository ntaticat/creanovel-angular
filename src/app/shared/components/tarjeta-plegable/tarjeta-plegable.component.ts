import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

let contador = 0;

/**
 * Un mini formulario plegable: plegado muestra una línea con su título y un resumen; abierto muestra todos sus campos.
 *
 * Los formularios del editor tienen muchas listas de mini formularios (variables, objetos, opciones, zonas...). Con todos abiertos
 * había que desplazarse entre ellos y cuidar de no tocar los campos del anterior. Plegados por defecto, solo se abre el que se edita:
 * quien usa este componente guarda cuál está abierto (ver `SeleccionUnica`) y aquí solo se pide abrir o cerrar.
 *
 * El contenido sigue en el DOM aunque esté plegado (solo oculto): así conserva lo escrito, los controles de un formulario reactivo
 * siguen existiendo y nada se vuelve a crear al abrir. Lo que va a la derecha del título (mover, quitar...) se proyecta con `acciones`
 * y se ve siempre.
 *
 * ```html
 * <app-tarjeta-plegable titulo="Salud" resumen="salud · número · 0–100" [abierta]="..." (abiertaChange)="...">
 *   <button acciones ...>...</button>
 *   ...campos...
 * </app-tarjeta-plegable>
 * ```
 */
@Component({
  selector: 'app-tarjeta-plegable',
  templateUrl: './tarjeta-plegable.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent],
  // Un elemento personalizado es en línea por defecto: la tarjeta ocupa todo el ancho y se apila con las demás.
  host: { class: 'block' },
})
export class TarjetaPlegableComponent {
  @Input() titulo = '';
  /** Lo esencial del contenido, en una línea: se ve mientras la tarjeta está plegada. */
  @Input() resumen = '';
  @Input() abierta = false;
  /** Falta algo obligatorio: se avisa en la línea de la tarjeta plegada, donde no se ven los campos. */
  @Input() advertencia = '';
  /** Contorno de color: la tarjeta que se está editando también en otro sitio (la zona elegida en el escenario). */
  @Input() resaltada = false;

  @Output() abiertaChange = new EventEmitter<boolean>();

  readonly id = `tarjeta-plegable-${++contador}`;
  readonly faAbierta = faChevronDown;
  readonly faPlegada = faChevronRight;
  readonly faAdvertencia = faTriangleExclamation;

  alternar(): void {
    this.abiertaChange.emit(!this.abierta);
  }
}
