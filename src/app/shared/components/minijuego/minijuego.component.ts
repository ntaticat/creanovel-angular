import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IMinijuegoConfig, IResultadoMinijuego } from '@models/motor.interfaces';
import {
  crearMinijuego,
  eventoMinijuego,
  IEstadoMinijuego,
  resultadoDe,
  resultadoOmitido,
  tickMinijuego,
} from 'src/app/shared/engine/minijuegos/minijuego';
import { IEstadoReflejo, fraccionRestanteReflejo } from 'src/app/shared/engine/minijuegos/reflejo';
import { IEstadoPrecision } from 'src/app/shared/engine/minijuegos/precision';
import { IEstadoSecuencia, TeclaSecuencia, teclaDesdeEvento } from 'src/app/shared/engine/minijuegos/secuencia';
import { IEstadoPulsaciones } from 'src/app/shared/engine/minijuegos/pulsaciones';
import { FACTOR_MAS_TIEMPO, MinijuegoPreferenciasService } from 'src/app/shared/services/minijuego-preferencias.service';

/** Reloj de los minijuegos, en ms. Se inyecta para poder controlar el tiempo en las pruebas. */
export const MINIJUEGO_RELOJ = new InjectionToken<() => number>('MINIJUEGO_RELOJ', {
  providedIn: 'root',
  factory: () => () => performance.now(),
});

/** Fuente de azar de los minijuegos (posición de los objetivos, zona, flechas). */
export const MINIJUEGO_ALEATORIO = new InjectionToken<() => number>('MINIJUEGO_ALEATORIO', {
  providedIn: 'root',
  factory: () => Math.random,
});

type Fase = 'listo' | 'jugando' | 'fin';

export const FLECHAS: Record<TeclaSecuencia, string> = {
  izquierda: '←',
  arriba: '↑',
  derecha: '→',
  abajo: '↓',
};

const INSTRUCCIONES: Record<IMinijuegoConfig['tipo'], string> = {
  reflejo: 'Pulsa cada objetivo antes de que desaparezca. Con el teclado, pulsa Espacio o Enter cuando aparezca.',
  precision: 'Detén el marcador dentro de la zona verde con un clic, o con Espacio o Enter.',
  secuencia: 'Pulsa las flechas en el orden que se indica, con el teclado o con los botones.',
  pulsaciones: 'Pulsa lo más rápido que puedas, con clics o con Espacio o Enter.',
};

/**
 * Dibuja y maneja un minijuego. La lógica está en `engine/minijuegos` (máquinas de estado puras); este componente solo
 * lleva el reloj, traduce clics y teclas en eventos y muestra el estado. Rellena a su contenedor (`h-full`).
 *
 * Accesibilidad: todo se puede hacer con el teclado, hay un modo "más tiempo" que se recuerda entre partidas, se puede
 * omitir el minijuego (cuenta como éxito con el puntaje máximo) y los cambios importantes se anuncian a los lectores de pantalla.
 */
@Component({
  selector: 'app-minijuego',
  templateUrl: './minijuego.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MinijuegoComponent implements OnChanges, OnDestroy {
  @Input() config!: IMinijuegoConfig;
  /** Texto del nodo ("¡Desactiva la trampa!"). */
  @Input() mensaje = '';
  @Input() textoContinuar = 'Continuar';

  @Output() terminado = new EventEmitter<IResultadoMinijuego>();

  @ViewChild('accionPrincipal') accionPrincipal?: ElementRef<HTMLButtonElement>;

  private readonly preferencias = inject(MinijuegoPreferenciasService);
  private readonly reloj = inject(MINIJUEGO_RELOJ);
  private readonly aleatorio = inject(MINIJUEGO_ALEATORIO);

  readonly FLECHAS = FLECHAS;
  // El orden importa para la cuadrícula: la flecha de arriba va primero para que la auto-colocación de CSS Grid la deje en la fila 1.
  readonly flechasOrden: TeclaSecuencia[] = ['arriba', 'izquierda', 'abajo', 'derecha'];

  fase: Fase = 'listo';
  estado?: IEstadoMinijuego;
  masTiempo = this.preferencias.masTiempo;
  /** Texto para lectores de pantalla (región aria-live). */
  anuncio = '';
  resultado?: IResultadoMinijuego;
  /** Hora del último cuadro: los getters de la plantilla usan este valor y no el reloj, para que no cambie entre comprobaciones. */
  ahoraCuadro = 0;

  private cuadro?: number;
  private anunciado = '';

  get instrucciones(): string {
    return INSTRUCCIONES[this.config.tipo];
  }

  get estadoReflejo(): IEstadoReflejo | undefined {
    return this.estado?.tipo === 'reflejo' ? this.estado : undefined;
  }

  get estadoPrecision(): IEstadoPrecision | undefined {
    return this.estado?.tipo === 'precision' ? this.estado : undefined;
  }

  get estadoSecuencia(): IEstadoSecuencia | undefined {
    return this.estado?.tipo === 'secuencia' ? this.estado : undefined;
  }

  get estadoPulsaciones(): IEstadoPulsaciones | undefined {
    return this.estado?.tipo === 'pulsaciones' ? this.estado : undefined;
  }

  /** Fracción (0–1) del tiempo que queda, para la barra de los minijuegos con límite. */
  get tiempoRestante(): number {
    const e = this.estado;
    if (e?.tipo === 'secuencia' || e?.tipo === 'pulsaciones') {
      return Math.min(1, Math.max(0, 1 - (this.ahoraCuadro - e.inicioEn) / e.limiteMs));
    }
    return 1;
  }

  get fraccionObjetivo(): number {
    return this.estadoReflejo ? fraccionRestanteReflejo(this.estadoReflejo, this.ahoraCuadro) : 0;
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['config']) {
      this.reiniciar();
    }
  }

  ngOnDestroy(): void {
    this.detenerBucle();
  }

  cambiarMasTiempo(activo: boolean): void {
    this.masTiempo = activo;
    this.preferencias.masTiempo = activo;
  }

  empezar(): void {
    if (this.fase !== 'listo') {
      return;
    }

    const ahora = this.reloj();
    this.ahoraCuadro = ahora;
    this.estado = crearMinijuego(this.config, ahora, {
      factorTiempo: this.masTiempo ? FACTOR_MAS_TIEMPO : 1,
      aleatorio: this.aleatorio,
    });
    this.fase = 'jugando';
    this.resultado = undefined;
    this.anunciar(this.mensajeInicio());
    this.iniciarBucle();
  }

  /** Salta el minijuego: cuenta como éxito con el puntaje máximo. */
  omitir(): void {
    if (this.fase === 'fin') {
      return;
    }
    this.detenerBucle();
    this.terminado.emit(resultadoOmitido(this.config));
  }

  continuar(): void {
    if (this.fase === 'fin' && this.resultado) {
      this.terminado.emit(this.resultado);
    }
  }

  /** Avanza el tiempo hasta `ahora` (lo llama el bucle de dibujo; es público para poder probarlo con un reloj falso). */
  tick(ahora: number = this.reloj()): void {
    if (this.fase !== 'jugando' || !this.estado) {
      return;
    }
    this.ahoraCuadro = ahora;
    this.aplicar(tickMinijuego(this.estado, ahora), ahora);
  }

  // ---- Eventos del jugador

  acertarObjetivo(): void {
    this.evento({ tipo: 'acierto' });
  }

  pararMarcador(): void {
    this.evento({ tipo: 'parar' });
  }

  pulsarBoton(): void {
    this.evento({ tipo: 'pulsar' });
  }

  pulsarFlecha(tecla: TeclaSecuencia): void {
    this.evento({ tipo: 'tecla', tecla });
  }

  @HostListener('document:keydown', ['$event'])
  teclado(evento: KeyboardEvent): void {
    if (this.fase !== 'jugando' || !this.estado || evento.repeat || evento.ctrlKey || evento.metaKey || evento.altKey) {
      return;
    }

    if (this.estado.tipo === 'secuencia') {
      const tecla = teclaDesdeEvento(evento.key);
      if (tecla) {
        evento.preventDefault();
        this.pulsarFlecha(tecla);
      }
      return;
    }

    if (evento.key === ' ' || evento.key === 'Enter') {
      // Sin esto Espacio desplazaría la página y Enter activaría el botón enfocado además de contar como pulsación.
      evento.preventDefault();
      this.estado.tipo === 'reflejo' ? this.acertarObjetivo() : this.estado.tipo === 'precision' ? this.pararMarcador() : this.pulsarBoton();
    }
  }

  // ---- Interno

  private evento(evento: Parameters<typeof eventoMinijuego>[1]): void {
    if (this.fase !== 'jugando' || !this.estado) {
      return;
    }
    const ahora = this.reloj();
    this.ahoraCuadro = ahora;
    this.aplicar(eventoMinijuego(this.estado, evento, ahora, { factorTiempo: 1, aleatorio: this.aleatorio }), ahora);
  }

  private aplicar(nuevo: IEstadoMinijuego, ahora: number): void {
    const anterior = this.estado;
    this.estado = nuevo;
    this.ahoraCuadro = ahora;

    const resultado = resultadoDe(nuevo);
    if (resultado) {
      this.detenerBucle();
      this.resultado = resultado;
      this.fase = 'fin';
      this.anunciar(resultado.exito ? '¡Lo lograste!' : 'No salió esta vez.');
      this.enfocarAccion();
      return;
    }

    this.anunciarProgreso(anterior, nuevo);
  }

  private reiniciar(): void {
    this.detenerBucle();
    this.fase = 'listo';
    this.estado = undefined;
    this.resultado = undefined;
    this.anuncio = '';
    this.anunciado = '';
    this.masTiempo = this.preferencias.masTiempo;
    this.enfocarAccion();
  }

  private iniciarBucle(): void {
    const paso = () => {
      this.tick();
      if (this.fase === 'jugando') {
        this.cuadro = requestAnimationFrame(paso);
      }
    };
    this.cuadro = requestAnimationFrame(paso);
  }

  private detenerBucle(): void {
    if (this.cuadro !== undefined) {
      cancelAnimationFrame(this.cuadro);
      this.cuadro = undefined;
    }
  }

  private enfocarAccion(): void {
    // El botón existe recién tras el siguiente ciclo de detección.
    setTimeout(() => this.accionPrincipal?.nativeElement.focus());
  }

  private anunciar(texto: string): void {
    if (texto && texto !== this.anunciado) {
      this.anunciado = texto;
      this.anuncio = texto;
    }
  }

  private mensajeInicio(): string {
    const e = this.estado;
    if (e?.tipo === 'secuencia') return `Secuencia: ${e.secuencia.map(t => t).join(', ')}`;
    if (e?.tipo === 'reflejo') return `Objetivo 1 de ${e.objetivos.length}`;
    if (e?.tipo === 'precision') return `Intento 1 de ${e.config.intentos}`;
    return e?.tipo === 'pulsaciones' ? `Pulsa ${e.config.objetivo} veces` : '';
  }

  private anunciarProgreso(anterior: IEstadoMinijuego | undefined, nuevo: IEstadoMinijuego): void {
    if (anterior?.tipo === 'reflejo' && nuevo.tipo === 'reflejo' && nuevo.indice !== anterior.indice) {
      this.anunciar(`Objetivo ${nuevo.indice + 1} de ${nuevo.objetivos.length}`);
    } else if (anterior?.tipo === 'precision' && nuevo.tipo === 'precision' && nuevo.intento !== anterior.intento) {
      this.anunciar(`Fallaste. Intento ${nuevo.intento} de ${nuevo.config.intentos}`);
    } else if (anterior?.tipo === 'secuencia' && nuevo.tipo === 'secuencia' && nuevo.indice !== anterior.indice) {
      this.anunciar(`Bien. Quedan ${nuevo.secuencia.length - nuevo.indice}`);
    }
  }
}
