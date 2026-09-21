import { IEstadoJuego } from '@models/motor.interfaces';
import { IDecision, IEntrada, instanceOfIConversacion, instanceOfIDecision, instanceOfIEntrada, instanceOfIEvalua, MixRecursosType } from '@models/recurso.interfaces';
import { NovelaMotor } from 'src/app/shared/engine/motor';
import {
  arteDeRegistro, CAMPOS, ClaveEntrada, datosDeRegistro, DEFINICIONES_REGISTRO, NODO, RECURSOS_REGISTRO, validarEntrada,
} from './novela-registro';

describe('novela de registro', () => {
  const recursos = new Map<string, MixRecursosType>(RECURSOS_REGISTRO.map(r => [r.recursoId, r]));
  const motor = new NovelaMotor(recursos, DEFINICIONES_REGISTRO);

  /** Una partida a mano, con lo mismo que hace el anfitrión: resolver, elegir opciones y aplicar lo escrito. */
  class Partida {
    estado: IEstadoJuego = motor.estadoInicial();
    actual!: MixRecursosType;
    constructor() { this.ir(NODO.inicio); }
    ir(id?: string) { const r = motor.resolver(id, this.estado); this.estado = r.estado; this.actual = r.recurso!; return this; }
    get id() { return this.actual.recursoId; }
    get texto() { return motor.texto(instanceOfIDecision(this.actual) ? (this.actual as IDecision).decisionMensaje : (this.actual as { mensaje: string; etiqueta?: string }).mensaje ?? (this.actual as IEntrada).etiqueta, this.estado); }
    siguiente() { return this.ir((this.actual as { siguienteRecursoId?: string }).siguienteRecursoId); }
    escribe(valor: string) { const e = this.actual as IEntrada; this.estado = motor.aplicarEntrada(e, valor, this.estado); return this.ir(e.siguienteRecursoId); }
    elige(mensaje: string) {
      const d = this.actual as IDecision;
      const op = motor.opcionesDe(d, this.estado).find(o => o.mensaje === mensaje)!;
      const eleccion = motor.elegirOpcion(d, op.id, this.estado)!;
      this.estado = eleccion.estado;
      return this.ir(eleccion.destinoId);
    }
  }

  /** Recorre el camino feliz hasta la confirmación. */
  const hastaConfirmar = () => {
    const p = new Partida();
    p.siguiente().siguiente();               // hola → ¿cómo te llamas? → Pide nombre
    p.escribe('Juan Pérez').siguiente();     // → Pide usuario
    p.escribe('juanperez').siguiente();      // → Pide correo
    p.escribe('juan@ejemplo.com').siguiente();  // → Pide contraseña
    p.escribe('Secreta#1');
    return p;
  };

  describe('el grafo', () => {
    const destinosDe = (r: MixRecursosType): string[] => [
      ...(instanceOfIConversacion(r) || instanceOfIEntrada(r) || instanceOfIEvalua(r) || r.tipoRecurso === 'recurso_asigna'
        ? [(r as { siguienteRecursoId?: string }).siguienteRecursoId ?? ''] : []),
      ...((r as IDecision).opciones ?? []).map(o => o.siguienteRecursoId ?? ''),
    ].filter(Boolean);

    it('los ids son únicos y todo enlace lleva a un nodo que existe', () => {
      expect(new Set(RECURSOS_REGISTRO.map(r => r.recursoId)).size).toBe(RECURSOS_REGISTRO.length);
      RECURSOS_REGISTRO.forEach(r => destinosDe(r).forEach(d => expect(recursos.has(d)).withContext(`${r.recursoId} → ${d}`).toBeTrue()));
    });

    it('todos los nodos se alcanzan desde el inicio o los activa el anfitrión (aviso, listo, fallo)', () => {
      const vistos = new Set<string>();
      // `aviso`, `listo` y `fallo` los activa el anfitrión (al validar y según responda el servidor), no un enlace
      const pendientes: string[] = [NODO.inicio, NODO.aviso, NODO.listo, 'fallo'];
      while (pendientes.length) {
        const id = pendientes.pop()!;
        if (vistos.has(id)) continue;
        vistos.add(id);
        destinosDe(recursos.get(id)!).forEach(d => pendientes.push(d));
      }
      expect(RECURSOS_REGISTRO.filter(r => !vistos.has(r.recursoId)).map(r => r.recursoId)).toEqual([]);
    });

    it('solo hay un nodo de inicio y un final', () => {
      expect(RECURSOS_REGISTRO.filter(r => r.primerRecurso).map(r => r.recursoId)).toEqual([NODO.inicio]);
      expect(RECURSOS_REGISTRO.filter(r => r.ultimoRecurso).map(r => r.recursoId)).toEqual([NODO.listo]);
    });

    it('cada Pide guarda en una variable definida y tiene su configuración de campo', () => {
      const claves = new Set(DEFINICIONES_REGISTRO.variables.map(v => v.clave));
      const pides = RECURSOS_REGISTRO.filter(instanceOfIEntrada) as IEntrada[];
      expect(pides.map(p => p.clave).sort()).toEqual(['email', 'nombre', 'password', 'usuario']);
      pides.forEach(p => {
        expect(claves.has(p.clave)).toBeTrue();
        expect(CAMPOS[p.clave as ClaveEntrada].nodo).toBe(p.recursoId);
      });
    });

    it('la contraseña se pide en un campo enmascarado y los demás datos con el tipo que ayuda al teclado del móvil', () => {
      expect(CAMPOS.password.tipo).toBe('password');
      expect(CAMPOS.email.tipo).toBe('email');
      expect(CAMPOS.password.autocompletar).toBe('new-password');
    });

    it('cada paso tiene su arte: personaje con su nombre y un fondo', () => {
      RECURSOS_REGISTRO.forEach(r => {
        const arte = arteDeRegistro(r.recursoId);
        expect(arte.personajeNombre).toBe('Dr. Cerebro');
        expect(arte.backgroundUrl).toMatch(/^https:\/\//);
        expect(arte.personajes?.length).toBe(1);
      });
    });
  });

  describe('validarEntrada (las reglas del servidor)', () => {
    it('nombre', () => {
      expect(validarEntrada('nombre', 'Juan Pérez')).toBeNull();
      expect(validarEntrada('nombre', '   ')).toContain('Necesito un nombre');
      expect(validarEntrada('nombre', 'x'.repeat(101))).toContain('demasiado largo');
    });

    it('nombre de usuario: 3 a 40 caracteres, solo letras, números y - . _ @ +', () => {
      ['juanperez', 'ju', 'juan.perez_1', 'a-b+c@d'].forEach(v => expect(validarEntrada('usuario', v) === null).withContext(v).toBe(v !== 'ju'));
      expect(validarEntrada('usuario', 'ju')).toContain('al menos 3');
      expect(validarEntrada('usuario', 'juan perez')).toContain('sin espacios');
      expect(validarEntrada('usuario', 'juán')).toContain('solo puedes usar');
      expect(validarEntrada('usuario', 'x'.repeat(41))).toContain('hasta 40');
    });

    it('correo', () => {
      expect(validarEntrada('email', 'juan@ejemplo.com')).toBeNull();
      ['juan', 'juan@', '@ejemplo.com', 'juan@ejemplo', 'ju an@ejemplo.com'].forEach(v => expect(validarEntrada('email', v)).withContext(v).toContain('no parece válido'));
    });

    it('contraseña: 6 caracteres, mayúscula, minúscula, número y símbolo; y dice lo que falta', () => {
      expect(validarEntrada('password', 'Secreta#1')).toBeNull();
      expect(validarEntrada('password', 'Ab#1x')).toContain('al menos 6 caracteres');
      expect(validarEntrada('password', 'secreta#1')).toContain('una mayúscula');
      expect(validarEntrada('password', 'SECRETA#1')).toContain('una minúscula');
      expect(validarEntrada('password', 'Secreta##')).toContain('un número');
      expect(validarEntrada('password', 'Secreta12')).toContain('un símbolo');
      expect(validarEntrada('password', 'abc')).toBe('Tu contraseña necesita: al menos 6 caracteres, una mayúscula, un número, un símbolo (por ejemplo ! o #).');
      expect(validarEntrada('password', ' Secreta#1')).toContain('espacios');
    });
  });

  describe('la historia', () => {
    it('camino feliz: pregunta cada dato, lo confirma con lo que escribió y cuenta el registro', () => {
      const p = new Partida();
      expect(p.texto).toContain('Soy el Dr. Cerebro');
      p.siguiente();
      expect(p.texto).toBe('¿Cómo te llamas?');
      p.siguiente();
      expect(p.id).toBe('nombre');
      p.escribe('Juan Pérez');
      expect(p.texto).toBe('Mucho gusto, Juan Pérez. ¿Cuál es tu nombre de usuario? (Este será tu identificador único)');
      p.siguiente().escribe('juanperez');
      expect(p.id).toBe('pregunta_email');
      p.siguiente().escribe('juan@ejemplo.com');
      expect(p.id).toBe('pregunta_password');
      p.siguiente().escribe('Secreta#1');

      expect(p.id).toBe('confirmar');
      expect(p.texto).toBe('Esto es lo que tengo: Juan Pérez, usuario «juanperez», correo juan@ejemplo.com. ¿Creo tu cuenta?');
      expect(datosDeRegistro(p.estado)).toEqual({ nombre: 'Juan Pérez', userName: 'juanperez', email: 'juan@ejemplo.com', password: 'Secreta#1' });

      p.elige('Sí, crear mi cuenta');
      expect(p.id).toBe(NODO.creando);
      expect(p.actual.tipoRecurso).toBe('recurso_conversacion');
      expect((p.actual as { siguienteRecursoId?: string }).siguienteRecursoId).toBeUndefined();   // sigue el anfitrión, según responda el servidor

      p.ir(NODO.listo);
      expect(p.texto).toBe('¡Listo, Juan Pérez! Tu cuenta ha sido creada. Bienvenido/a.');
    });

    it('un nombre con llaves se muestra tal cual, no se interpreta como una variable', () => {
      const p = new Partida();
      p.siguiente().siguiente().escribe('{userName} {email}');

      expect(p.texto).toContain('Mucho gusto, {userName} {email}.');
    });

    it('la primera vez no se salta pasos ni se confirma antes de tiempo', () => {
      const p = new Partida().siguiente().siguiente();
      const visitados: string[] = [];
      ['Ana', 'ana1', 'a@b.co', 'Secreta#1'].forEach(v => { visitados.push(p.id); p.escribe(v); while (instanceOfIConversacion(p.actual)) { visitados.push(p.id); p.siguiente(); } });
      expect(visitados).toEqual(['nombre', 'saludo_nombre', 'usuario', 'pregunta_email', 'email', 'pregunta_password', 'password']);
    });

    for (const [opcion, nodo, valor] of [
      ['Mi nombre', 'nombre', 'Otro Nombre'],
      ['Mi nombre de usuario', 'usuario', 'otrouser'],
      ['Mi correo', 'email', 'otro@ejemplo.com'],
      ['Mi contraseña', 'password', 'Nueva#Clave9'],
    ] as const) {
      it(`corregir «${opcion}» cambia solo ese dato y vuelve a la confirmación`, () => {
        const p = hastaConfirmar();
        const antes = datosDeRegistro(p.estado);

        p.elige('Quiero corregir algo');
        expect(p.id).toBe('corregir');
        p.elige(opcion);
        expect(p.id).toBe(nodo);
        p.escribe(valor);

        expect(p.id).toBe('confirmar');   // no repasa las preguntas siguientes
        const despues = datosDeRegistro(p.estado);
        const cambiados = (Object.keys(antes) as (keyof typeof antes)[]).filter(k => antes[k] !== despues[k]);
        expect(cambiados.length).toBe(1);
        expect(Object.values(despues)).toContain(valor);
      });
    }

    it('«Nada, todo está bien» vuelve a la confirmación sin cambiar nada', () => {
      const p = hastaConfirmar();
      const antes = datosDeRegistro(p.estado);

      p.elige('Quiero corregir algo').elige('Nada, todo está bien');

      expect(p.id).toBe('confirmar');
      expect(datosDeRegistro(p.estado)).toEqual(antes);
    });

    for (const clave of ['nombre', 'usuario', 'email', 'password'] as ClaveEntrada[]) {
      it(`cuando lo escrito para «${clave}» no vale, el aviso lo cuenta y la historia vuelve a esa misma pregunta`, () => {
        const p = new Partida();
        p.estado = { ...p.estado, vars: { ...p.estado.vars, aviso: 'Esto no vale.', retorno: clave } };

        p.ir(NODO.aviso);
        expect(p.texto).toBe('Esto no vale.');
        p.siguiente();

        expect(p.id).toBe(CAMPOS[clave].nodo);
        expect((p.actual as IEntrada).clave).toBe(clave);
      });
    }

    it('si el servidor falla se puede reintentar o elegir otro usuario, y con otro usuario se vuelve a confirmar', () => {
      const p = hastaConfirmar();
      p.elige('Sí, crear mi cuenta').ir('fallo');
      expect(p.texto).toContain('No pude crear tu cuenta');

      p.elige('Intentarlo de nuevo');
      expect(p.id).toBe(NODO.creando);

      p.ir('fallo').elige('Elegir otro nombre de usuario');
      expect(p.id).toBe('usuario');
      p.escribe('otro_usuario');
      expect(p.id).toBe('confirmar');
      expect(datosDeRegistro(p.estado).userName).toBe('otro_usuario');
      expect(datosDeRegistro(p.estado).password).toBe('Secreta#1');
    });
  });
});
