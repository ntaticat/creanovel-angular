import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  ICondicion,
  IDefiniciones,
  IVariableDef,
  OpComparacion,
  VariableValor,
} from '@models/motor.interfaces';
import { SintaxisCampoComponent } from 'src/app/shared/components/sintaxis-campo/sintaxis-campo.component';
import { guardarModoSintaxis, leerModoSintaxis } from 'src/app/shared/utils/preferencia-sintaxis.util';
import { VariableValorInputComponent } from '../variable-valor-input/variable-valor-input.component';
import {
  codigoFila,
  filaDesdeCodigo,
  filaNueva,
  hayReglasPosibles,
  IFilaCondicion,
  IModeloCondicion,
  operadoresFila,
  parseCondicion,
  serializarCondicion,
} from './condicion-editor.model';

export const ETIQUETAS_OPERADOR: Record<OpComparacion, string> = {
  '==': 'es igual a',
  '!=': 'es distinto de',
  '>': 'es mayor que',
  '>=': 'es mayor o igual que',
  '<': 'es menor que',
  '<=': 'es menor o igual que',
};

/**
 * Editor visual de una condición: una lista de reglas ("salud es mayor o igual que 50") unidas por
 * "todas" o "alguna". Emite el AST que valida el backend; nunca texto evaluable. También se puede escribir como
 * texto (`salud >= 50 y no en patio`), que admite todo lo que el editor visual no puede mostrar (grupos anidados):
 * una condición así se abre siempre como texto.
 */
@Component({
  selector: 'app-condicion-builder',
  templateUrl: './condicion-builder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent, VariableValorInputComponent, SintaxisCampoComponent],
})
export class CondicionBuilderComponent implements OnChanges {
  @Input() condicion?: ICondicion | null;
  @Input() definiciones: IDefiniciones = { variables: [] };
  @Input() etiqueta = 'Condición';

  @Output() condicionChange = new EventEmitter<ICondicion | null>();

  faPlus = faPlus;
  faTrash = faTrash;
  ETIQUETAS_OPERADOR = ETIQUETAS_OPERADOR;

  modelo: IModeloCondicion = { modo: 'y', filas: [] };
  /** Más compleja de lo que el editor visual puede mostrar: solo se edita como texto. */
  avanzada = false;
  modoTexto = leerModoSintaxis() === 'texto';

  get verComoTexto(): boolean {
    return this.modoTexto || this.avanzada;
  }

  cambiarModoTexto(texto: boolean): void {
    this.modoTexto = texto;
    guardarModoSintaxis(texto ? 'texto' : 'visual');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['condicion']) {
      const modelo = parseCondicion(this.condicion);
      this.avanzada = modelo === 'avanzada';
      if (modelo !== 'avanzada') {
        this.modelo = modelo;
      }
    }
  }

  /** Hay algo que citar en una regla: una variable, un objeto o una ubicación. */
  get hayReglas(): boolean {
    return hayReglasPosibles(this.definiciones);
  }

  codigo(fila: IFilaCondicion): string {
    return codigoFila(fila);
  }

  /** Si lo que cita la regla ya no está definido (se borró después de escribirla). */
  existe(fila: IFilaCondicion): boolean {
    switch (fila.tipo) {
      case 'objeto':
        return !!this.definiciones.objetos?.some(o => o.id === fila.ref);
      case 'en':
        return !!this.definiciones.ubicaciones?.some(u => u.id === fila.ref);
      case 'logro':
        return !!this.definiciones.logros?.some(l => l.id === fila.ref);
      case 'final':
        return !!this.definiciones.finales?.some(f => f.id === fila.ref);
      default:
        return !!this.def(fila.ref);
    }
  }

  get condicionJson(): string {
    return JSON.stringify(this.condicion);
  }

  def(clave: string): IVariableDef | undefined {
    return this.definiciones.variables.find(v => v.clave === clave);
  }

  operadores(fila: IFilaCondicion): OpComparacion[] {
    return operadoresFila(fila, this.definiciones);
  }

  agregar(): void {
    const fila = filaNueva(this.definiciones);
    if (!fila) {
      return;
    }
    this.modelo = { ...this.modelo, filas: [...this.modelo.filas, fila] };
    this.emitir();
  }

  quitar(indice: number): void {
    this.modelo = { ...this.modelo, filas: this.modelo.filas.filter((_, i) => i !== indice) };
    this.emitir();
  }

  cambiarModo(modo: 'y' | 'o'): void {
    this.modelo = { ...this.modelo, modo };
    this.emitir();
  }

  cambiarNegar(indice: number, negar: boolean): void {
    this.actualizarFila(indice, { negar });
  }

  /** Cambiar de qué trata la regla (otra variable, un objeto, una ubicación) reinicia operador y valor. */
  cambiarQue(indice: number, codigo: string): void {
    const { negar: _negar, ...nueva } = filaDesdeCodigo(codigo, this.definiciones);
    this.actualizarFila(indice, nueva);
  }

  cambiarCantidad(indice: number, texto: string): void {
    const cantidad = Number(texto);
    if (texto.trim() !== '' && Number.isInteger(cantidad) && cantidad >= 0) {
      this.actualizarFila(indice, { valor: cantidad });
    }
  }

  cambiarOperador(indice: number, op: OpComparacion): void {
    this.actualizarFila(indice, { op });
  }

  cambiarValor(indice: number, valor: VariableValor): void {
    this.actualizarFila(indice, { valor });
  }

  quitarCondicionAvanzada(): void {
    this.condicionChange.emit(null);
  }

  private actualizarFila(indice: number, cambio: Partial<IFilaCondicion>): void {
    this.modelo = {
      ...this.modelo,
      filas: this.modelo.filas.map((f, i) => (i === indice ? { ...f, ...cambio } : f)),
    };
    this.emitir();
  }

  private emitir(): void {
    this.condicionChange.emit(serializarCondicion(this.modelo));
  }
}
