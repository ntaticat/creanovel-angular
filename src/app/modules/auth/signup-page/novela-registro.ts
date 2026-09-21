import { ICondicion, IDefiniciones, IEfecto, IEstadoJuego } from '@models/motor.interfaces';
import {
  IConversacion,
  IDecision,
  IDecisionOpcion,
  IEntrada,
  IEvalua,
  MixRecursosType,
  RecursosEnum,
} from '@models/recurso.interfaces';
import { IUsuarioPost } from '@models/usuario.interfaces';
import { IRecursoArte } from 'src/app/shared/services/novela-player.service';

/**
 * La novela con la que se crea una cuenta. Es una novela de verdad: la reproduce el mismo motor (`NovelaMotor`) y el mismo escenario
 * (`app-novela-stage`) que las novelas de los autores, con nodos Habla, Pide, Selecciona y Evalúa (y efectos en las opciones). Lo único que no puede hacer el
 * motor —validar lo escrito y llamar al servidor— lo hace el anfitrión (`SignupPageComponent`), que se apoya en variables para que la
 * historia reaccione: `aviso` y `retorno` cuando lo escrito no vale, y `corrigiendo` cuando el jugador vuelve a cambiar un dato.
 */

/** Nodos que el anfitrión necesita reconocer. */
export const NODO = {
  inicio: 'inicio',
  aviso: 'aviso',
  creando: 'creando',
  listo: 'listo',
} as const;

/** Variables de la partida. Las cuatro primeras son los datos del usuario; el resto son de la propia historia. */
export const DEFINICIONES_REGISTRO: IDefiniciones = {
  variables: [
    ...(['nombre', 'usuario', 'email', 'password'] as const).map(clave => ({
      clave, etiqueta: clave, tipo: 'texto' as const, inicial: '', valores: [], hud: 'oculto' as const,
    })),
    // Por qué lo escrito no vale y a qué pregunta hay que volver.
    { clave: 'aviso', etiqueta: 'aviso', tipo: 'texto', inicial: '', valores: [], hud: 'oculto' },
    { clave: 'retorno', etiqueta: 'retorno', tipo: 'texto', inicial: '', valores: [], hud: 'oculto' },
    // Si el jugador está corrigiendo un dato, al terminar vuelve a la confirmación en vez de repasar todo.
    { clave: 'corrigiendo', etiqueta: 'corrigiendo', tipo: 'booleano', inicial: false, valores: [], hud: 'oculto' },
  ],
};

/** Las claves de variable del motor son snake_case en minúscula; `usuario` se envía al servidor como `userName`. */
export type ClaveEntrada = 'nombre' | 'usuario' | 'email' | 'password';

/** Cómo se pide cada dato: tipo de campo (la contraseña va enmascarada) y ayuda del navegador para autocompletar. */
export const CAMPOS: Record<ClaveEntrada, { tipo: 'text' | 'email' | 'password'; autocompletar: string; nodo: string }> = {
  nombre: { tipo: 'text', autocompletar: 'name', nodo: 'nombre' },
  usuario: { tipo: 'text', autocompletar: 'username', nodo: 'usuario' },
  email: { tipo: 'email', autocompletar: 'email', nodo: 'email' },
  password: { tipo: 'password', autocompletar: 'new-password', nodo: 'password' },
};

// ---- Validación: las mismas reglas que aplica el backend (ASP.NET Identity con su configuración por defecto)

const USUARIO_VALIDO = /^[A-Za-z0-9\-._@+]+$/;
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `null` si el valor sirve; si no, lo que Dr. Cerebro le dice al jugador. */
export function validarEntrada(clave: string, valor: string): string | null {
  const texto = valor.trim();

  switch (clave) {
    case 'nombre':
      if (!texto) return 'Necesito un nombre para llamarte. ¿Cómo te llamas?';
      if (texto.length > 100) return 'Ese nombre es demasiado largo. Prueba con uno de hasta 100 letras.';
      return null;

    case 'usuario':
      if (texto.length < 3) return 'Tu nombre de usuario necesita al menos 3 caracteres.';
      if (texto.length > 40) return 'Tu nombre de usuario puede tener hasta 40 caracteres.';
      if (!USUARIO_VALIDO.test(texto)) return 'En el nombre de usuario solo puedes usar letras, números y los símbolos - . _ @ + (sin espacios).';
      return null;

    case 'email':
      return CORREO_VALIDO.test(texto) && texto.length <= 200 ? null : 'Ese correo no parece válido. Debe verse así: nombre@ejemplo.com';

    case 'password': {
      if (valor !== texto) return 'La contraseña no puede empezar ni terminar con espacios.';
      const faltan = [
        texto.length < 6 && 'al menos 6 caracteres',
        !/\p{Lu}/u.test(texto) && 'una mayúscula',
        !/\p{Ll}/u.test(texto) && 'una minúscula',
        !/\p{Nd}/u.test(texto) && 'un número',
        !/[^\p{L}\p{N}]/u.test(texto) && 'un símbolo (por ejemplo ! o #)',
      ].filter(Boolean);
      return faltan.length ? `Tu contraseña necesita: ${faltan.join(', ')}.` : null;
    }

    default:
      return null;
  }
}

// ---- Los nodos

const AUTOR = 'Dr. Cerebro';
const base = (recursoId: string) => ({ recursoId, escenaId: 'registro', primerRecurso: false, ultimoRecurso: false });

const habla = (recursoId: string, mensaje: string, siguienteRecursoId?: string): IConversacion => ({
  ...base(recursoId), tipoRecurso: RecursosEnum.conversacion, mensaje, autorMensaje: AUTOR, siguienteRecursoId,
});

const pide = (recursoId: string, clave: ClaveEntrada, etiqueta: string, placeholder: string, siguienteRecursoId: string): IEntrada => ({
  ...base(recursoId), tipoRecurso: RecursosEnum.entrada, etiqueta, clave, valor: '', placeholder, siguienteRecursoId,
});

const opcion = (recursoId: string, orden: number, tipo: IDecisionOpcion['tipo'], parcial: Partial<IDecisionOpcion>): IDecisionOpcion => ({
  recursoDecisionOpcionId: `${recursoId}#${orden}`, opcionMensaje: '', recursoDecisionId: recursoId, orden, tipo, condicionModo: 'ocultar', ...parcial,
});

const selecciona = (
  recursoId: string,
  decisionMensaje: string,
  opciones: { mensaje: string; destino: string; efectos?: IEfecto[] }[]
): IDecision => ({
  ...base(recursoId), tipoRecurso: RecursosEnum.decision, decisionMensaje, autorDecisionMensaje: AUTOR,
  opciones: opciones.map((o, i) => opcion(recursoId, i, 'opcion', { opcionMensaje: o.mensaje, siguienteRecursoId: o.destino, efectos: o.efectos })),
});

const evalua = (recursoId: string, ramas: { condicion: ICondicion; destino: string }[], sino: string): IEvalua => ({
  ...base(recursoId), tipoRecurso: RecursosEnum.evalua, siguienteRecursoId: sino,
  opciones: ramas.map((r, i) => opcion(recursoId, i, 'rama', { condicion: r.condicion, siguienteRecursoId: r.destino })),
});

const corrigiendo: ICondicion = { var: 'corrigiendo', op: '==', valor: true };
const corregir = (destino: string, mensaje: string) => ({ mensaje, destino, efectos: [{ var: 'corrigiendo', op: 'fijar', valor: true }] as IEfecto[] });

export const RECURSOS_REGISTRO: MixRecursosType[] = [
  { ...habla(NODO.inicio, '¡Hola! Soy el Dr. Cerebro, tu asistente virtual. Vamos a crear tu cuenta.', 'pregunta_nombre'), primerRecurso: true },

  habla('pregunta_nombre', '¿Cómo te llamas?', 'nombre'),
  pide('nombre', 'nombre', 'Ingresa tu nombre completo', 'Ej: Juan Pérez', 'despues_nombre'),
  // Al corregir un dato se vuelve a la confirmación; la primera vez se sigue con la siguiente pregunta.
  evalua('despues_nombre', [{ condicion: corrigiendo, destino: 'confirmar' }], 'saludo_nombre'),

  habla('saludo_nombre', 'Mucho gusto, {nombre}. ¿Cuál es tu nombre de usuario? (Este será tu identificador único)', 'usuario'),
  pide('usuario', 'usuario', 'Ingresa tu nombre de usuario', 'Ej: juanperez123', 'despues_usuario'),
  evalua('despues_usuario', [{ condicion: corrigiendo, destino: 'confirmar' }], 'pregunta_email'),

  habla('pregunta_email', '¿Cuál es tu correo electrónico? (Lo usaremos para contactarte)', 'email'),
  pide('email', 'email', 'Ingresa tu correo electrónico', 'Ej: juan.perez@example.com', 'despues_email'),
  evalua('despues_email', [{ condicion: corrigiendo, destino: 'confirmar' }], 'pregunta_password'),

  habla('pregunta_password', 'Por último, crea una contraseña segura: al menos 6 caracteres, con mayúscula, minúscula, número y un símbolo.', 'password'),
  pide('password', 'password', 'Ingresa tu contraseña', 'Tu contraseña', 'confirmar'),

  // Lo escrito no valía: el anfitrión guarda el motivo en `aviso` y el nodo a repetir en `retorno`.
  habla(NODO.aviso, '{aviso}', 'volver'),
  evalua(
    'volver',
    (Object.keys(CAMPOS) as ClaveEntrada[]).map(clave => ({
      condicion: { var: 'retorno', op: '==', valor: clave } as ICondicion,
      destino: CAMPOS[clave].nodo,
    })),
    'nombre'
  ),

  selecciona('confirmar', 'Esto es lo que tengo: {nombre}, usuario «{usuario}», correo {email}. ¿Creo tu cuenta?', [
    { mensaje: 'Sí, crear mi cuenta', destino: NODO.creando },
    { mensaje: 'Quiero corregir algo', destino: 'corregir' },
  ]),
  selecciona('corregir', '¿Qué quieres corregir?', [
    corregir('nombre', 'Mi nombre'),
    corregir('usuario', 'Mi nombre de usuario'),
    corregir('email', 'Mi correo'),
    corregir('password', 'Mi contraseña'),
    { mensaje: 'Nada, todo está bien', destino: 'confirmar' },
  ]),

  // El anfitrión llama al servidor al llegar aquí y sigue por `listo` o `fallo` según responda.
  habla(NODO.creando, 'Perfecto. Dame un momento mientras creo tu cuenta...'),
  { ...habla(NODO.listo, '¡Listo, {nombre}! Tu cuenta ha sido creada. Bienvenido/a.'), ultimoRecurso: true },
  selecciona('fallo', 'No pude crear tu cuenta. Es probable que ese nombre de usuario ya esté en uso, o que haya un problema de conexión.', [
    { mensaje: 'Intentarlo de nuevo', destino: NODO.creando },
    corregir('usuario', 'Elegir otro nombre de usuario'),
  ]),
];

// ---- Arte de cada paso (las mismas imágenes que tenía el signup)

const SPRITES = {
  chihiro: 'https://static.wikia.nocookie.net/danganronpa/images/0/04/Chihiro_Fujisaki_Halfbody_Sprite_%2813%29.png',
  shuichi: 'https://static.wikia.nocookie.net/danganronpa/images/b/b9/Danganronpa_V3_Shuichi_Saihara_Halfbody_Sprite_%28Hat%29_%281%29.png',
  tsumugi: 'https://static.wikia.nocookie.net/danganronpa/images/5/53/Danganronpa_V3_Tsumugi_Shirogane_Halfbody_Sprite_%28Aoi_Asahina%29_%281%29.png',
  kaede: 'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
  final: 'https://i.redd.it/1leqbt052gj41.png',
};
const FONDOS = {
  entrada: 'https://cdnb.artstation.com/p/assets/images/images/033/279/501/large/saito-ryou-nj9tmksdq1c.jpg?1609047375',
  nombre: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d142f6cf-ca18-4aba-a6a8-acfa8ef8e53a/ddco6hf-2bd791d8-e5bb-4852-bee5-a895a35d682e.jpg',
  pregunta: 'https://cdna.artstation.com/p/assets/images/images/024/507/728/large/saito-ryou-1.jpg',
  cuarto: 'https://i.imgur.com/7UjYhjq.png',
  noche: 'https://cdna.artstation.com/p/assets/images/images/040/915/304/large/alexander-sord-night-get.jpg?1630252220',
};

const escena = (sprite: string, fondo: string): IRecursoArte => ({
  personajeNombre: AUTOR,
  backgroundUrl: fondo,
  personajes: [{ personajeSpriteId: sprite, nombre: AUTOR, url: sprite, x: 50, y: 55, escala: 0.95, espejo: false }],
});

const ARTE: Record<string, IRecursoArte> = {
  [NODO.inicio]: escena(SPRITES.chihiro, FONDOS.entrada),
  pregunta_nombre: escena(SPRITES.shuichi, FONDOS.nombre),
  nombre: escena(SPRITES.tsumugi, FONDOS.pregunta),
  [NODO.listo]: escena(SPRITES.final, FONDOS.noche),
};
const ARTE_POR_DEFECTO = escena(SPRITES.kaede, FONDOS.cuarto);

export function arteDeRegistro(recursoId: string): IRecursoArte {
  return ARTE[recursoId] ?? ARTE_POR_DEFECTO;
}

/** Lo que se envía al servidor, con lo que el jugador escribió a lo largo de la historia. */
export function datosDeRegistro(estado: IEstadoJuego): IUsuarioPost {
  const dato = (clave: ClaveEntrada) => String(estado.vars[clave] ?? '');
  return { nombre: dato('nombre'), userName: dato('usuario'), email: dato('email'), password: dato('password') };
}
