import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faTrash } from '@fortawesome/free-solid-svg-icons';
import { IPersonaje } from '@models/personaje.interfaces';
import { IPersonajeEnEscena } from '@models/recurso.interfaces';
import { UploadsService } from '@services/uploads.service';
import {
  colocacionInicial,
  ESCALA_MAXIMA,
  cajaDelSprite,
  ESCALA_MINIMA,
  escalarColocacion,
  estiloSpriteEscenario,
  limitarColocacion,
  MAX_PERSONAJES_ESCENARIO,
  moverColocacion,
} from 'src/app/shared/utils/sprite-escenario.util';

/** Un sprite de la biblioteca de la novela, listo para mostrarse. */
interface ISpriteDisponible {
  personajeSpriteId: string;
  personajeNombre: string;
  nombre: string;
  url: string;
}

interface IArrastre {
  indice: number;
  clienteX: number;
  clienteY: number;
  inicial: IPersonajeEnEscena;
}

/**
 * Editor visual de los personajes de un nodo sobre su fondo, en la misma proporción 16:9 que ve el jugador (como el editor de zonas de
 * un Explora). Cada sprite se dibuja entero, sin recorte, con el mismo estilo que usa el escenario (`estiloSpriteEscenario`).
 *
 * Se mueve arrastrándolo; la rueda del ratón (o + y −) lo agranda y lo achica; con el teclado, las flechas lo mueven. Debajo hay una
 * lista con un control de tamaño, el volteo, el orden de apilado y quitar. Puede haber varios personajes (hasta `MAX_PERSONAJES_ESCENARIO`).
 */
@Component({
  selector: 'app-personajes-escenario-editor',
  templateUrl: './personajes-escenario-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgStyle, FaIconComponent],
})
export class PersonajesEscenarioEditorComponent implements OnChanges {
  /** Los personajes de la novela: de sus sprites se elige a quién añadir. */
  @Input() personajes: IPersonaje[] = [];
  /** Lo colocado ahora, de atrás hacia delante. */
  @Input() colocados: IPersonajeEnEscena[] = [];
  @Input() fondoUrl?: string | null;

  @Output() colocadosChange = new EventEmitter<IPersonajeEnEscena[]>();

  @ViewChild('escenario', { static: true }) escenario!: ElementRef<HTMLElement>;

  faArriba = faArrowUp;
  faAbajo = faArrowDown;
  faQuitar = faTrash;

  readonly escalaMinima = ESCALA_MINIMA;
  readonly escalaMaxima = ESCALA_MAXIMA;
  readonly maximo = MAX_PERSONAJES_ESCENARIO;

  seleccionado = -1;
  disponibles: ISpriteDisponible[] = [];
  private porId = new Map<string, ISpriteDisponible>();
  /** Proporción (ancho / alto) de cada imagen, conocida cuando carga: con ella la caja de un sprite se ajusta a su imagen. */
  private aspectos = new Map<string, number>();
  private arrastre?: IArrastre;

  constructor(private uploadsService: UploadsService) {}

  ngOnChanges(): void {
    this.disponibles = this.personajes.flatMap(personaje =>
      (personaje.sprites ?? []).map(sprite => ({
        personajeSpriteId: sprite.personajeSpriteId,
        personajeNombre: personaje.nombre,
        nombre: sprite.nombre,
        url: this.uploadsService.resolveUrl(sprite.direccionImagen),
      }))
    );
    this.porId = new Map(this.disponibles.map(s => [s.personajeSpriteId, s]));

    if (this.seleccionado >= this.colocados.length) {
      this.seleccionado = -1;
    }
  }

  get puedeAgregar(): boolean {
    return this.colocados.length < this.maximo;
  }

  /** Datos del sprite para dibujarlo; `undefined` si ya no está en la biblioteca de la novela. */
  sprite(colocado: IPersonajeEnEscena): ISpriteDisponible | undefined {
    return this.porId.get(colocado.personajeSpriteId);
  }

  /** Se llama al cargar la imagen de un sprite. */
  registrarAspecto(url: string, imagen: HTMLImageElement): void {
    if (imagen.naturalWidth > 0 && imagen.naturalHeight > 0 && !this.aspectos.has(url)) {
      this.aspectos.set(url, imagen.naturalWidth / imagen.naturalHeight);
    }
  }

  /**
   * Caja del sprite dentro del escenario (% del escenario): justo lo que ocupa su imagen entera, para que la zona donde se puede
   * arrastrar sea la del sprite y un sprite ancho no tape con una caja transparente a los que tiene debajo.
   * Hasta que carga la imagen no se conoce su proporción y se deja que el navegador la ajuste.
   */
  caja(sprite: ISpriteDisponible): { ancho: number; alto: number } | undefined {
    const aspecto = this.aspectos.get(sprite.url);
    return aspecto ? cajaDelSprite(aspecto) : undefined;
  }

  estilo(colocado: IPersonajeEnEscena): Record<string, string> {
    return estiloSpriteEscenario(colocado);
  }

  etiqueta(colocado: IPersonajeEnEscena): string {
    const sprite = this.sprite(colocado);
    return sprite ? `${sprite.personajeNombre} — ${sprite.nombre}` : 'Sprite que ya no está en la novela';
  }

  // ---- Lista

  agregar(sprite: ISpriteDisponible): void {
    if (!this.puedeAgregar) {
      return;
    }
    const nuevo: IPersonajeEnEscena = {
      personajeSpriteId: sprite.personajeSpriteId,
      ...colocacionInicial(this.colocados.length),
    };
    this.seleccionado = this.colocados.length;
    this.emitir([...this.colocados, nuevo]);
  }

  quitar(indice: number): void {
    this.seleccionado = -1;
    this.emitir(this.colocados.filter((_, i) => i !== indice));
  }

  /** Cambia el orden de apilado: `+1` lo trae al frente (se dibuja después), `-1` lo envía atrás. */
  apilar(indice: number, sentido: 1 | -1): void {
    const destino = indice + sentido;
    if (destino < 0 || destino >= this.colocados.length) {
      return;
    }
    const lista = [...this.colocados];
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    this.seleccionado = destino;
    this.emitir(lista);
  }

  cambiarEscala(indice: number, texto: string): void {
    const valor = Number(texto);
    if (Number.isFinite(valor)) {
      this.reemplazar(indice, limitarColocacion({ ...this.colocados[indice], escala: valor }));
    }
  }

  cambiarEspejo(indice: number, espejo: boolean): void {
    this.reemplazar(indice, { ...this.colocados[indice], espejo });
  }

  // ---- Escenario

  seleccionar(indice: number): void {
    this.seleccionado = indice;
  }

  iniciarMover(evento: PointerEvent, indice: number): void {
    if (evento.button !== 0) {
      return;
    }
    evento.stopPropagation();
    this.seleccionado = indice;
    this.arrastre = { indice, clienteX: evento.clientX, clienteY: evento.clientY, inicial: this.colocados[indice] };
    try {
      this.escenario.nativeElement.setPointerCapture(evento.pointerId);
    } catch {
      // El puntero ya no está activo (p. ej. un toque cancelado): el arrastre sigue por los eventos del escenario.
    }
  }

  arrastrar(evento: PointerEvent): void {
    const arrastre = this.arrastre;
    if (!arrastre) {
      return;
    }
    const rect = this.escenario.nativeElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const dx = ((evento.clientX - arrastre.clienteX) / rect.width) * 100;
    const dy = ((evento.clientY - arrastre.clienteY) / rect.height) * 100;
    this.reemplazar(arrastre.indice, moverColocacion(arrastre.inicial, dx, dy));
  }

  soltar(): void {
    this.arrastre = undefined;
  }

  /** La rueda sobre un sprite lo agranda o lo achica (y no hace desplazar el formulario). */
  rueda(evento: WheelEvent, indice: number): void {
    evento.preventDefault();
    this.seleccionado = indice;
    this.reemplazar(indice, escalarColocacion(this.colocados[indice], evento.deltaY < 0 ? 1.08 : 1 / 1.08));
  }

  teclado(evento: KeyboardEvent, indice: number): void {
    const paso = evento.altKey ? 0.5 : 1;
    const movimientos: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    };
    const movimiento = movimientos[evento.key];

    if (movimiento) {
      evento.preventDefault();
      this.reemplazar(indice, moverColocacion(this.colocados[indice], movimiento[0], movimiento[1]));
    } else if (evento.key === '+' || evento.key === '=') {
      evento.preventDefault();
      this.reemplazar(indice, escalarColocacion(this.colocados[indice], 1.05));
    } else if (evento.key === '-') {
      evento.preventDefault();
      this.reemplazar(indice, escalarColocacion(this.colocados[indice], 1 / 1.05));
    } else if (evento.key === 'Delete' || evento.key === 'Backspace') {
      evento.preventDefault();
      this.quitar(indice);
    }
  }

  private reemplazar(indice: number, colocado: IPersonajeEnEscena): void {
    this.emitir(this.colocados.map((c, i) => (i === indice ? colocado : c)));
  }

  private emitir(lista: IPersonajeEnEscena[]): void {
    this.colocadosChange.emit(lista);
  }
}
