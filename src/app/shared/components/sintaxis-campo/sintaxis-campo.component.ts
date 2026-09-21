import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ICondicion, IDefiniciones, IEfecto } from '@models/motor.interfaces';
import { IErrorSintaxis, parsearCondicion, parsearEfectos } from 'src/app/shared/engine/sintaxis';
import { describirCondicion, escribirEfectos } from 'src/app/shared/engine/texto';
import { lineaYColumna } from 'src/app/shared/utils/preferencia-sintaxis.util';

interface IGrupoInsertar {
  titulo: string;
  items: string[];
}

/**
 * Campo de texto para escribir una condición o una lista de efectos con la sintaxis del motor (ver engine/sintaxis.ts).
 * Lee lo escrito mientras se escribe: si se entiende, emite el mismo AST que el editor visual; si no, muestra qué falla
 * y dónde, y no emite nada (lo último válido se conserva). Es un superconjunto del editor visual: admite grupos anidados.
 */
@Component({
  selector: 'app-sintaxis-campo',
  templateUrl: './sintaxis-campo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SintaxisCampoComponent implements OnChanges {
  @Input() modo: 'condicion' | 'efectos' = 'condicion';
  @Input() condicion?: ICondicion | null;
  @Input() efectos?: IEfecto[] | null;
  @Input() definiciones: IDefiniciones = { variables: [] };
  @Input() etiqueta = '';

  @Output() condicionChange = new EventEmitter<ICondicion | null>();
  @Output() efectosChange = new EventEmitter<IEfecto[]>();

  @ViewChild('campo') campo?: ElementRef<HTMLTextAreaElement>;

  texto = '';
  errores: IErrorSintaxis[] = [];
  /** Lo último que se emitió (o recibió), para no reescribir el texto que el autor está tecleando cuando el padre lo devuelve. */
  private ultimo?: string;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['condicion'] || cambios['efectos'] || cambios['modo']) {
      const valor = this.modo === 'condicion' ? (this.condicion ?? null) : (this.efectos ?? []);
      const json = JSON.stringify(valor);
      if (json !== this.ultimo) {
        this.ultimo = json;
        this.errores = [];
        this.texto =
          this.modo === 'condicion'
            ? this.condicion
              ? describirCondicion(this.condicion)
              : ''
            : escribirEfectos(this.efectos);
      }
    }
  }

  get filas(): number {
    return this.modo === 'condicion' ? 2 : Math.min(8, Math.max(3, this.texto.split('\n').length + 1));
  }

  get ayuda(): string {
    return this.modo === 'condicion'
      ? 'Ejemplos: salud >= 50 y no en patio · tengo llave · tiene_pareja o logro valiente · (a o b) y c'
      : 'Uno por línea o separados por «;»: salud -= 10 · tiempo = "noche" · alternar tiene_pareja · avanzar tiempo · dar 2 moneda · quitar llave · ir patio · logro valiente';
  }

  /** Lo que se puede insertar con el selector: las claves definidas y las palabras del lenguaje según el modo. */
  get grupos(): IGrupoInsertar[] {
    const d = this.definiciones;
    const grupos: IGrupoInsertar[] = [
      { titulo: 'Variables', items: d.variables.map(v => v.clave) },
      { titulo: 'Objetos', items: (d.objetos ?? []).map(o => o.id) },
      { titulo: 'Ubicaciones', items: (d.ubicaciones ?? []).map(u => u.id) },
      { titulo: 'Logros', items: (d.logros ?? []).map(l => l.id) },
    ];
    if (this.modo === 'condicion') {
      grupos.push({ titulo: 'Finales', items: (d.finales ?? []).map(f => f.id) });
    }
    grupos.push({
      titulo: 'Palabras',
      items: this.modo === 'condicion' ? ['y', 'o', 'no', 'en', 'tengo', 'objeto', 'logro', 'final'] : ['dar', 'quitar', 'ir', 'alternar', 'avanzar', 'logro'],
    });
    return grupos.filter(g => g.items.length);
  }

  posicion(error: IErrorSintaxis): string {
    if (!this.texto.includes('\n')) {
      return `columna ${error.posicion + 1}`;
    }
    const { linea, columna } = lineaYColumna(this.texto, error.posicion);
    return `línea ${linea}, columna ${columna}`;
  }

  cambiar(texto: string): void {
    this.texto = texto;

    if (this.modo === 'condicion') {
      const r = parsearCondicion(texto, this.definiciones);
      this.errores = r.errores;
      if (!r.errores.length) {
        this.ultimo = JSON.stringify(r.condicion);
        this.condicionChange.emit(r.condicion);
      }
    } else {
      const r = parsearEfectos(texto, this.definiciones);
      this.errores = r.errores;
      if (!r.errores.length) {
        this.ultimo = JSON.stringify(r.efectos);
        this.efectosChange.emit(r.efectos);
      }
    }
  }

  /** Inserta lo elegido en el punto del cursor, con espacios alrededor si hacen falta. */
  insertar(seleccion: HTMLSelectElement): void {
    const valor = seleccion.value;
    seleccion.value = '';
    const area = this.campo?.nativeElement;
    if (!valor || !area) {
      return;
    }

    const inicio = area.selectionStart ?? this.texto.length;
    const fin = area.selectionEnd ?? inicio;
    const antes = this.texto.slice(0, inicio);
    const despues = this.texto.slice(fin);
    const izquierda = antes && !/[\s(]$/.test(antes) ? ' ' : '';
    const derecha = despues && !/^[\s;)]/.test(despues) ? ' ' : '';
    const insertado = `${izquierda}${valor}${derecha}`;

    this.cambiar(antes + insertado + despues);
    const cursor = antes.length + insertado.length;
    setTimeout(() => {
      area.focus();
      area.setSelectionRange(cursor, cursor);
    });
  }
}
