import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IEstadoJuego } from '@models/motor.interfaces';
import {
  IConversacion,
  IDecision,
  IEntrada,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
  MixRecursosType,
} from '@models/recurso.interfaces';
import { UsuariosService } from '@services/usuarios.service';
import { NovelaStageComponent } from 'src/app/shared/components/novela-stage/novela-stage.component';
import { NovelaMotor, IOpcionJuego } from 'src/app/shared/engine/motor';
import { IRecursoArte } from 'src/app/shared/services/novela-player.service';
import {
  arteDeRegistro,
  CAMPOS,
  ClaveEntrada,
  datosDeRegistro,
  DEFINICIONES_REGISTRO,
  NODO,
  RECURSOS_REGISTRO,
  validarEntrada,
} from './novela-registro';

/**
 * Crear una cuenta es jugar una novela (`novela-registro.ts`) con el mismo motor y el mismo escenario que las novelas de los autores.
 * Este componente hace lo único que el motor no sabe hacer: comprobar lo que el jugador escribe, llamar al servidor y pasar a la
 * pantalla de inicio de sesión al terminar. Cuando lo escrito no vale, se lo dice a la historia con variables (`aviso`, `retorno`) y es
 * ella la que reacciona.
 */
@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NovelaStageComponent, RouterLink],
})
export class SignupPageComponent implements OnInit {
  private readonly motor = new NovelaMotor(new Map(RECURSOS_REGISTRO.map(r => [r.recursoId, r])), DEFINICIONES_REGISTRO);

  estado: IEstadoJuego = this.motor.estadoInicial();
  recursoActual?: MixRecursosType;
  arte: IRecursoArte = {};
  mensaje = '';
  opciones: IOpcionJuego[] = [];
  errorMotor = '';
  registrando = false;

  /** Lo último que el jugador escribió y no valió, para que lo corrija en vez de volver a escribirlo. */
  private intento = '';
  valorEntrada = '';

  constructor(
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.avanzarA(NODO.inicio);
  }

  get esConversacion(): boolean {
    return !!this.recursoActual && instanceOfIConversacion(this.recursoActual);
  }

  get esDecision(): boolean {
    return !!this.recursoActual && instanceOfIDecision(this.recursoActual);
  }

  get esEntrada(): boolean {
    return !!this.recursoActual && instanceOfIEntrada(this.recursoActual);
  }

  get esFinal(): boolean {
    return this.recursoActual?.recursoId === NODO.listo;
  }

  /** Qué dato pide el nodo actual, si es un Pide. */
  get campo(): (typeof CAMPOS)[ClaveEntrada] | undefined {
    return this.esEntrada ? CAMPOS[(this.recursoActual as IEntrada).clave as ClaveEntrada] : undefined;
  }

  get placeholderEntrada(): string {
    return this.esEntrada ? (this.recursoActual as IEntrada).placeholder : '';
  }

  /** El botón de avanzar sale en los Habla que tienen a dónde ir (y en el último, que lleva a iniciar sesión). */
  get mostrarSiguiente(): boolean {
    return this.esConversacion && (!!(this.recursoActual as IConversacion).siguienteRecursoId || this.esFinal);
  }

  siguiente(): void {
    if (!this.recursoActual || !instanceOfIConversacion(this.recursoActual)) {
      return;
    }
    if (this.esFinal) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    this.avanzarA(this.recursoActual.siguienteRecursoId);
  }

  elegirOpcion(opcionId: string): void {
    if (!this.recursoActual || !instanceOfIDecision(this.recursoActual)) {
      return;
    }
    const eleccion = this.motor.elegirOpcion(this.recursoActual as IDecision, opcionId, this.estado);
    if (eleccion) {
      this.estado = eleccion.estado;
      this.avanzarA(eleccion.destinoId);
    }
  }

  enviarEntrada(valor: string): void {
    if (!this.recursoActual || !instanceOfIEntrada(this.recursoActual)) {
      return;
    }
    const entrada = this.recursoActual as IEntrada;
    const problema = validarEntrada(entrada.clave, valor);

    if (problema) {
      // La historia reacciona: Dr. Cerebro dice qué falla y luego se vuelve a la misma pregunta.
      this.intento = entrada.clave === 'password' ? '' : valor;
      this.estado = this.conVariables({ aviso: problema, retorno: entrada.clave });
      this.avanzarA(NODO.aviso);
      return;
    }

    this.estado = this.motor.aplicarEntrada(entrada, valor, this.estado);
    this.avanzarA(entrada.siguienteRecursoId);
  }

  /** Único punto por el que avanza la historia. */
  private avanzarA(recursoId?: string): void {
    const resolucion = this.motor.resolver(recursoId, this.estado);

    if (!resolucion.recurso) {
      this.errorMotor = 'No se pudo continuar con el registro. Recarga la página e inténtalo de nuevo.';
      return;
    }

    const recurso = resolucion.recurso;
    this.errorMotor = '';
    this.estado = resolucion.estado;
    this.recursoActual = recurso;
    this.arte = arteDeRegistro(recurso.recursoId);
    this.opciones = instanceOfIDecision(recurso) ? this.motor.opcionesDe(recurso as IDecision, this.estado) : [];
    this.mensaje = this.motor.texto(this.mensajeDe(recurso), this.estado);

    // Un dato ya escrito se muestra al volver a pedirlo (salvo la contraseña, que se escribe de nuevo). Lo que no valió se guarda
    // mientras la historia pasa por el aviso y solo se gasta al llegar de nuevo al campo.
    if (instanceOfIEntrada(recurso)) {
      const clave = (recurso as IEntrada).clave;
      this.valorEntrada = clave === 'password' ? '' : this.intento || String(this.estado.vars[clave] ?? '');
      this.intento = '';
    }

    if (recurso.recursoId === NODO.creando) {
      this.registrar();
    }
  }

  private registrar(): void {
    if (this.registrando) {
      return;
    }
    this.registrando = true;

    this.usuariosService.postUsuario(datosDeRegistro(this.estado)).subscribe({
      next: () => {
        this.registrando = false;
        // La contraseña ya no hace falta: no se queda en memoria.
        this.estado = this.conVariables({ password: '' });
        this.avanzarA(NODO.listo);
      },
      error: () => {
        this.registrando = false;
        this.avanzarA('fallo');
      },
    });
  }

  private conVariables(cambios: Record<string, string>): IEstadoJuego {
    return { ...this.estado, vars: { ...this.estado.vars, ...cambios } };
  }

  private mensajeDe(recurso: MixRecursosType): string {
    if (instanceOfIConversacion(recurso)) return (recurso as IConversacion).mensaje;
    if (instanceOfIDecision(recurso)) return (recurso as IDecision).decisionMensaje;
    if (instanceOfIEntrada(recurso)) return (recurso as IEntrada).etiqueta;
    return '';
  }
}
