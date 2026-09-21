import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  esEfectoIr,
  esEfectoLogro,
  esEfectoObjeto,
  esEfectoVariable,
  IDefiniciones,
  IEfecto,
  IEfectoVariable,
  IVariableDef,
  OpEfecto,
  VariableTipo,
  VariableValor,
} from '@models/motor.interfaces';
import { escribirEfectos } from 'src/app/shared/engine/texto';
import { SintaxisCampoComponent } from 'src/app/shared/components/sintaxis-campo/sintaxis-campo.component';
import { leerModoSintaxis, guardarModoSintaxis } from 'src/app/shared/utils/preferencia-sintaxis.util';
import { valorPorDefecto } from '../condicion-builder/condicion-editor.model';
import { VariableValorInputComponent } from '../variable-valor-input/variable-valor-input.component';

export const ETIQUETAS_EFECTO: Record<OpEfecto, string> = {
  fijar: 'Fijar en',
  sumar: 'Sumar',
  restar: 'Restar',
  multiplicar: 'Multiplicar por',
  alternar: 'Alternar (sí/no)',
  avanzar: 'Avanzar al siguiente valor',
};

/** Operaciones de una variable según su tipo. `avanzar` solo tiene sentido con una lista de valores (un reloj: mañana → tarde → noche). */
export function operacionesPara(tipo: VariableTipo | undefined, tieneLista = false): OpEfecto[] {
  switch (tipo) {
    case 'numero':
      return ['fijar', 'sumar', 'restar', 'multiplicar'];
    case 'booleano':
      return ['fijar', 'alternar'];
    default:
      return tieneLista ? ['fijar', 'avanzar'] : ['fijar'];
  }
}

/** Código de la opción del select "¿qué cambia?": `var:salud`, `objeto:llave`, `ir:patio`, `logro:valiente`. */
export function codigoEfecto(efecto: IEfecto): string {
  if (esEfectoIr(efecto)) return `ir:${efecto.ir}`;
  if (esEfectoLogro(efecto)) return `logro:${efecto.logro}`;
  if (esEfectoObjeto(efecto)) return `objeto:${efecto.objeto}`;
  return `var:${efecto.var}`;
}

/** Un efecto nuevo, con operación y valor válidos, para lo que indica el código. */
export function efectoDesdeCodigo(codigo: string, defs: IDefiniciones): IEfecto {
  const separador = codigo.indexOf(':');
  const tipo = codigo.slice(0, separador);
  const ref = codigo.slice(separador + 1);

  if (tipo === 'ir') return { ir: ref };
  if (tipo === 'logro') return { logro: ref };
  if (tipo === 'objeto') return { objeto: ref, op: 'dar', cantidad: 1 };

  const def = defs.variables.find(v => v.clave === ref);
  return {
    var: ref,
    op: def?.tipo === 'numero' ? 'sumar' : 'fijar',
    valor: def?.tipo === 'numero' ? 1 : valorPorDefecto(def),
  };
}

/** ¿Hay algo que cambiar? Una variable, un objeto, una ubicación o un logro. */
export function hayEfectosPosibles(defs: IDefiniciones): boolean {
  return (
    defs.variables.length > 0 ||
    (defs.objetos?.length ?? 0) > 0 ||
    (defs.ubicaciones?.length ?? 0) > 0 ||
    (defs.logros?.length ?? 0) > 0
  );
}

/** El primer efecto posible con lo definido: una variable, si no un objeto, una ubicación o un logro. */
export function efectoNuevo(defs: IDefiniciones): IEfecto | undefined {
  const variable = defs.variables[0];
  if (variable) return efectoDesdeCodigo(`var:${variable.clave}`, defs);
  const objeto = defs.objetos?.[0];
  if (objeto) return efectoDesdeCodigo(`objeto:${objeto.id}`, defs);
  const ubicacion = defs.ubicaciones?.[0];
  if (ubicacion) return efectoDesdeCodigo(`ir:${ubicacion.id}`, defs);
  const logro = defs.logros?.[0];
  if (logro) return efectoDesdeCodigo(`logro:${logro.id}`, defs);
  return undefined;
}

/**
 * Lista editable de efectos ("sumar 10 a afecto", "dar la llave", "ir al patio", "avanzar el reloj"). Se puede editar
 * fila por fila o escribirla como texto (`salud -= 10; dar llave`), que es lo que muestra al pulsar «Escribir como texto».
 */
@Component({
  selector: 'app-efectos-editor',
  templateUrl: './efectos-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent, VariableValorInputComponent, SintaxisCampoComponent],
})
export class EfectosEditorComponent {
  @Input() efectos?: IEfecto[] | null;
  @Input() definiciones: IDefiniciones = { variables: [] };
  @Input() etiqueta = 'Efectos';

  @Output() efectosChange = new EventEmitter<IEfecto[]>();

  faPlus = faPlus;
  faTrash = faTrash;
  ETIQUETAS_EFECTO = ETIQUETAS_EFECTO;

  modoTexto = leerModoSintaxis() === 'texto';

  get filas(): IEfecto[] {
    return this.efectos ?? [];
  }

  /** Hay algo que cambiar: una variable, un objeto, una ubicación o un logro. */
  get hayEfectos(): boolean {
    return hayEfectosPosibles(this.definiciones);
  }

  get textoInicial(): string {
    return escribirEfectos(this.efectos);
  }

  cambiarModo(texto: boolean): void {
    this.modoTexto = texto;
    guardarModoSintaxis(texto ? 'texto' : 'visual');
  }

  codigo(efecto: IEfecto): string {
    return codigoEfecto(efecto);
  }

  def(clave: string): IVariableDef | undefined {
    return this.definiciones.variables.find(v => v.clave === clave);
  }

  /** La variable de un efecto de variable (los demás tipos no la tienen). */
  variable(efecto: IEfecto): IEfectoVariable | undefined {
    return esEfectoVariable(efecto) ? efecto : undefined;
  }

  /** Si lo que cita el efecto ya no está definido (se borró después de escribirlo). */
  existe(efecto: IEfecto): boolean {
    if (esEfectoIr(efecto)) return !!this.definiciones.ubicaciones?.some(u => u.id === efecto.ir);
    if (esEfectoLogro(efecto)) return !!this.definiciones.logros?.some(l => l.id === efecto.logro);
    if (esEfectoObjeto(efecto)) return !!this.definiciones.objetos?.some(o => o.id === efecto.objeto);
    return !!this.def(efecto.var);
  }

  referencia(efecto: IEfecto): string {
    return this.codigo(efecto).split(':')[1];
  }

  operaciones(efecto: IEfectoVariable): OpEfecto[] {
    const def = this.def(efecto.var);
    return operacionesPara(def?.tipo, (def?.valores?.length ?? 0) >= 2);
  }

  esVariable = esEfectoVariable;
  esObjeto = esEfectoObjeto;
  esLogro = esEfectoLogro;

  agregar(): void {
    const nuevo = efectoNuevo(this.definiciones);
    if (nuevo) {
      this.efectosChange.emit([...this.filas, nuevo]);
    }
  }

  quitar(indice: number): void {
    this.efectosChange.emit(this.filas.filter((_, i) => i !== indice));
  }

  cambiarQue(indice: number, codigo: string): void {
    this.reemplazar(indice, efectoDesdeCodigo(codigo, this.definiciones));
  }

  cambiarOperacion(indice: number, op: OpEfecto): void {
    const actual = this.filas[indice];
    if (!esEfectoVariable(actual)) {
      return;
    }
    // "alternar" y "avanzar" no llevan valor; el resto sí, y arranca en uno válido si no lo tenía.
    this.reemplazar(
      indice,
      op === 'alternar' || op === 'avanzar'
        ? { var: actual.var, op }
        : { var: actual.var, op, valor: actual.valor ?? valorPorDefecto(this.def(actual.var)) }
    );
  }

  cambiarValor(indice: number, valor: VariableValor): void {
    const actual = this.filas[indice];
    if (esEfectoVariable(actual)) {
      this.reemplazar(indice, { ...actual, valor });
    }
  }

  cambiarOperacionObjeto(indice: number, op: 'dar' | 'quitar'): void {
    const actual = this.filas[indice];
    if (esEfectoObjeto(actual)) {
      this.reemplazar(indice, { ...actual, op });
    }
  }

  cambiarCantidad(indice: number, texto: string): void {
    const actual = this.filas[indice];
    const cantidad = Number(texto);
    if (esEfectoObjeto(actual) && Number.isInteger(cantidad) && cantidad >= 1) {
      this.reemplazar(indice, { ...actual, cantidad });
    }
  }

  private reemplazar(indice: number, efecto: IEfecto): void {
    this.efectosChange.emit(this.filas.map((e, i) => (i === indice ? efecto : e)));
  }
}
