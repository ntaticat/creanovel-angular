import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { agregarEtiquetas, MAX_ETIQUETAS, MAX_LONGITUD_ETIQUETA, quitarEtiqueta } from './escenas-etiquetas';

let siguienteId = 0;

/**
 * Campo para escribir etiquetas: Enter o coma añaden la que se está escribiendo (también al salir del campo), Retroceso sobre el campo
 * vacío quita la última y `sugerencias` ofrece las que ya usan otras escenas. No guarda nada: emite la lista nueva.
 */
@Component({
  selector: 'app-etiquetas-input',
  templateUrl: './etiquetas-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, FaIconComponent],
})
export class EtiquetasInputComponent {
  @Input() etiquetas: string[] = [];
  @Input() sugerencias: string[] = [];
  @Output() etiquetasChange = new EventEmitter<string[]>();

  readonly faXmark = faXmark;
  readonly maxLongitud = MAX_LONGITUD_ETIQUETA;
  readonly maximo = MAX_ETIQUETAS;
  readonly listaId = `etiquetas-sugerencias-${siguienteId++}`;

  texto = '';

  get lleno(): boolean {
    return this.etiquetas.length >= MAX_ETIQUETAS;
  }

  /** Las sugerencias que aún no están puestas. */
  get sugerenciasLibres(): string[] {
    const puestas = new Set(this.etiquetas.map(e => e.toLowerCase()));
    return this.sugerencias.filter(s => !puestas.has(s.toLowerCase()));
  }

  onKeydown(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' || evento.key === ',') {
      // Enter dentro de un formulario lo enviaría; aquí solo confirma la etiqueta.
      evento.preventDefault();
      this.confirmar();
    } else if (evento.key === 'Backspace' && this.texto === '' && this.etiquetas.length > 0) {
      this.etiquetasChange.emit(this.etiquetas.slice(0, -1));
    }
  }

  confirmar(): void {
    const texto = this.texto;
    this.texto = '';
    if (!texto.trim()) return;

    const nuevas = agregarEtiquetas(this.etiquetas, texto, this.sugerencias);
    if (nuevas.length !== this.etiquetas.length) {
      this.etiquetasChange.emit(nuevas);
    }
  }

  quitar(etiqueta: string): void {
    this.etiquetasChange.emit(quitarEtiqueta(this.etiquetas, etiqueta));
  }
}
