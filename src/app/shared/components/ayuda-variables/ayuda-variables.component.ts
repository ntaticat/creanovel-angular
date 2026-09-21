import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { IDefiniciones } from '@models/motor.interfaces';
import { crearEstadoInicial } from 'src/app/shared/engine/estado';
import { interpolar, validarPlantilla } from 'src/app/shared/engine/interpolacion';
import { IErrorSintaxis } from 'src/app/shared/engine/sintaxis';

/**
 * Ayuda para los campos de texto que ve el jugador: inserta variables entre llaves ({nombre}, {objeto:llave},
 * {ubicacion}, {si condición: a | b}) en el punto del cursor, avisa de las que no existen y muestra cómo se leería
 * el texto con los valores iniciales de la partida.
 */
@Component({
  selector: 'app-ayuda-variables',
  templateUrl: './ayuda-variables.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AyudaVariablesComponent {
  /** El <input> o <textarea> donde se inserta (para conocer la posición del cursor). */
  @Input() campo?: HTMLInputElement | HTMLTextAreaElement | null;
  @Input() control?: AbstractControl | null;
  @Input() definiciones: IDefiniciones | null | undefined;

  get defs(): IDefiniciones {
    return this.definiciones ?? { variables: [] };
  }

  get texto(): string {
    return typeof this.control?.value === 'string' ? this.control.value : '';
  }

  get hayQueInsertar(): boolean {
    const d = this.defs;
    return d.variables.length > 0 || (d.objetos?.length ?? 0) > 0 || (d.ubicaciones?.length ?? 0) > 0;
  }

  get errores(): IErrorSintaxis[] {
    return validarPlantilla(this.texto, this.definiciones);
  }

  /** Cómo se lee el texto al empezar la partida; solo si el texto usa llaves. */
  get vista(): string {
    return /[{}]/.test(this.texto) ? interpolar(this.texto, crearEstadoInicial(this.defs), this.defs) : '';
  }

  insertar(seleccion: HTMLSelectElement): void {
    const valor = seleccion.value;
    seleccion.value = '';
    if (!valor || !this.control) {
      return;
    }

    const texto = this.texto;
    const campo = this.campo;
    const inicio = campo?.selectionStart ?? texto.length;
    const fin = campo?.selectionEnd ?? inicio;
    const nuevo = texto.slice(0, inicio) + valor + texto.slice(fin);

    this.control.setValue(nuevo);
    this.control.markAsDirty();
    const cursor = inicio + valor.length;
    setTimeout(() => {
      campo?.focus();
      campo?.setSelectionRange(cursor, cursor);
    });
  }
}
