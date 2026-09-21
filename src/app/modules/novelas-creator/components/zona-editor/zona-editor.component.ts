import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { IRegion } from '@models/motor.interfaces';
import { IPersonajeVista } from 'src/app/shared/services/novela-player.service';
import { estiloSpriteEscenario } from 'src/app/shared/utils/sprite-escenario.util';
import {
  esZonaValida,
  limitarRegion,
  moverRegion,
  puntoEnPorcentaje,
  redimensionarRegion,
  regionDesdeArrastre,
  IPunto,
} from 'src/app/shared/utils/region.util';

export interface IZonaEditable {
  etiqueta: string;
  region: IRegion | null;
}

type ModoArrastre = 'crear' | 'mover' | 'redimensionar';

interface IArrastre {
  modo: ModoArrastre;
  indice: number;
  /** Punto del escenario donde empezó el arrastre (en %), para crear. */
  inicio: IPunto;
  /** Posición de pantalla donde empezó, para mover y redimensionar por diferencia. */
  clienteInicio: IPunto;
  regionInicial?: IRegion;
}

/**
 * Editor visual de las zonas de un Explora sobre su fondo, en la misma proporción 16:9 que ve el jugador.
 * Se dibuja arrastrando sobre el fondo, se mueve arrastrando la zona y se redimensiona con su esquina;
 * con el teclado, las flechas mueven la zona seleccionada y Mayús+flechas la redimensionan.
 * Las coordenadas son % del escenario, así que no dependen del tamaño de pantalla.
 */
@Component({
  selector: 'app-zona-editor',
  templateUrl: './zona-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgStyle],
})
export class ZonaEditorComponent {
  @Input() fondoUrl?: string | null;
  /** Los personajes del nodo, de fondo: ayudan a colocar las zonas sobre ellos. No se pueden pulsar ni mover desde aquí. */
  @Input() personajes: IPersonajeVista[] = [];
  @Input() zonas: IZonaEditable[] = [];
  @Input() seleccionada = -1;

  @Output() zonaCreada = new EventEmitter<IRegion>();
  @Output() regionCambiada = new EventEmitter<{ indice: number; region: IRegion }>();
  @Output() seleccionar = new EventEmitter<number>();

  @ViewChild('escenario', { static: true }) escenario!: ElementRef<HTMLElement>;

  /** Zona que se está dibujando, antes de soltar. */
  borrador?: IRegion;
  private arrastre?: IArrastre;

  /** Cómo se dibuja cada personaje: el mismo estilo que el escenario del jugador. */
  estiloPersonaje(personaje: IPersonajeVista): Record<string, string> {
    return estiloSpriteEscenario(personaje);
  }

  iniciarCrear(evento: PointerEvent): void {
    if (evento.button !== 0) {
      return;
    }
    const inicio = this.punto(evento);
    this.arrastre = { modo: 'crear', indice: -1, inicio, clienteInicio: this.cliente(evento) };
    this.borrador = { x: inicio.x, y: inicio.y, ancho: 0, alto: 0 };
    this.capturar(evento);
    this.seleccionar.emit(-1);
  }

  iniciarMover(evento: PointerEvent, indice: number): void {
    const region = this.zonas[indice]?.region;
    if (evento.button !== 0 || !region) {
      return;
    }
    evento.stopPropagation();
    this.arrastre = {
      modo: 'mover',
      indice,
      inicio: this.punto(evento),
      clienteInicio: this.cliente(evento),
      regionInicial: region,
    };
    this.capturar(evento);
    this.seleccionar.emit(indice);
  }

  iniciarRedimensionar(evento: PointerEvent, indice: number): void {
    const region = this.zonas[indice]?.region;
    if (evento.button !== 0 || !region) {
      return;
    }
    evento.stopPropagation();
    this.arrastre = {
      modo: 'redimensionar',
      indice,
      inicio: this.punto(evento),
      clienteInicio: this.cliente(evento),
      regionInicial: region,
    };
    this.capturar(evento);
    this.seleccionar.emit(indice);
  }

  arrastrar(evento: PointerEvent): void {
    const arrastre = this.arrastre;
    if (!arrastre) {
      return;
    }

    if (arrastre.modo === 'crear') {
      this.borrador = regionDesdeArrastre(arrastre.inicio, this.punto(evento));
      return;
    }

    const { dx, dy } = this.diferencia(evento, arrastre);
    const region =
      arrastre.modo === 'mover'
        ? moverRegion(arrastre.regionInicial!, dx, dy)
        : redimensionarRegion(arrastre.regionInicial!, dx, dy);
    this.regionCambiada.emit({ indice: arrastre.indice, region });
  }

  soltar(): void {
    const arrastre = this.arrastre;
    this.arrastre = undefined;

    if (arrastre?.modo === 'crear' && this.borrador && esZonaValida(this.borrador)) {
      this.zonaCreada.emit(limitarRegion(this.borrador));
    }
    this.borrador = undefined;
  }

  teclado(evento: KeyboardEvent, indice: number): void {
    const region = this.zonas[indice]?.region;
    const paso = evento.altKey ? 0.5 : 1;
    const flechas: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    };
    const movimiento = flechas[evento.key];

    if (!region || !movimiento) {
      return;
    }

    evento.preventDefault();
    this.regionCambiada.emit({
      indice,
      region: evento.shiftKey
        ? redimensionarRegion(region, movimiento[0], movimiento[1])
        : moverRegion(region, movimiento[0], movimiento[1]),
    });
  }

  private diferencia(evento: PointerEvent, arrastre: IArrastre): { dx: number; dy: number } {
    const rect = this.escenario.nativeElement.getBoundingClientRect();
    return {
      dx: ((evento.clientX - arrastre.clienteInicio.x) / rect.width) * 100,
      dy: ((evento.clientY - arrastre.clienteInicio.y) / rect.height) * 100,
    };
  }

  private punto(evento: PointerEvent): IPunto {
    return puntoEnPorcentaje(evento.clientX, evento.clientY, this.escenario.nativeElement.getBoundingClientRect());
  }

  private cliente(evento: PointerEvent): IPunto {
    return { x: evento.clientX, y: evento.clientY };
  }

  /** Captura el puntero en el escenario: el arrastre sigue aunque el cursor salga de la zona o del escenario. */
  private capturar(evento: PointerEvent): void {
    try {
      this.escenario.nativeElement.setPointerCapture(evento.pointerId);
    } catch {
      // El puntero ya no está activo (p. ej. un toque cancelado): el arrastre sigue por los eventos del escenario.
    }
  }
}
