import { Component, OnInit } from '@angular/core';
import {
  faArrowRight,
  faArrowLeft,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import {
  MixRecursosType,
  instanceOfIConversacion,
  instanceOfIDecision,
  instanceOfIEntrada,
} from '@models/recurso.interfaces';
import { SignupService } from '@services/signup.service';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent implements OnInit {
  instanceOfIConversacion = instanceOfIConversacion;
  instanceOfIDecision = instanceOfIDecision;
  instanceOfIEntrada = instanceOfIEntrada;

  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faCog = faCog;

  currentRecursoId: string = '1';

  lecturaRecursos: string[] = [];

  loginRecursos: MixRecursosType[] = [
    {
      mensaje:
        '¡Hola! Soy el Dr. Cerebro, tu asistente virtual. Vamos a crear tu cuenta.',
      siguienteRecursoId: '2',
      recursoId: '1',
      escenaId: '1',
      primerRecurso: true,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/0/04/Chihiro_Fujisaki_Halfbody_Sprite_%2813%29.png',
      backgroundUrl:
        'https://cdnb.artstation.com/p/assets/images/images/033/279/501/large/saito-ryou-nj9tmksdq1c.jpg?1609047375',
    },
    {
      mensaje: '¿Cómo te llamas?',
      siguienteRecursoId: '3',
      recursoId: '2',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/b/b9/Danganronpa_V3_Shuichi_Saihara_Halfbody_Sprite_%28Hat%29_%281%29.png',
      backgroundUrl:
        'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/d142f6cf-ca18-4aba-a6a8-acfa8ef8e53a/ddco6hf-2bd791d8-e5bb-4852-bee5-a895a35d682e.jpg',
    },
    {
      etiqueta: 'Ingresa tu nombre completo',
      clave: 'nombre',
      valor: '',
      placeholder: 'Ej: Juan Pérez',
      siguienteRecursoId: '4',
      recursoId: '3',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_entrada',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/5/53/Danganronpa_V3_Tsumugi_Shirogane_Halfbody_Sprite_%28Aoi_Asahina%29_%281%29.png',
      backgroundUrl:
        'https://cdna.artstation.com/p/assets/images/images/024/507/728/large/saito-ryou-1.jpg',
    },
    {
      mensaje:
        '¿Cuál es tu nombre de usuario? (Este será tu identificador único)',
      siguienteRecursoId: '5',
      recursoId: '4',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      etiqueta: 'Ingresa tu nombre de usuario',
      clave: 'userName',
      valor: '',
      placeholder: 'Ej: juanperez123',
      siguienteRecursoId: '6',
      recursoId: '5',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_entrada',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      mensaje: '¿Cuál es tu correo electrónico? (Lo usaremos para contactarte)',
      siguienteRecursoId: '7',
      recursoId: '6',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      etiqueta: 'Ingresa tu correo electrónico',
      clave: 'email',
      valor: '',
      placeholder: 'Ej: juan.perez@example.com',
      siguienteRecursoId: '8',
      recursoId: '7',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_entrada',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      mensaje: 'Por último, crea una contraseña segura.',
      siguienteRecursoId: '9',
      recursoId: '8',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      etiqueta: 'Ingresa tu contraseña',
      clave: 'password',
      valor: '',
      placeholder: 'Mínimo 8 caracteres',
      siguienteRecursoId: '10',
      recursoId: '9',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: false,
      tipoRecurso: 'recurso_entrada',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl:
        'https://static.wikia.nocookie.net/danganronpa/images/6/6b/Danganronpa_V3_Kaede_Akamatsu_Halfbody_Sprite_%281%29.png',
      backgroundUrl: 'https://i.imgur.com/7UjYhjq.png',
    },
    {
      mensaje: '¡Listo! Tu cuenta ha sido creada. Bienvenido/a.',
      siguienteRecursoId: undefined,
      recursoId: '10',
      escenaId: '1',
      primerRecurso: false,
      ultimoRecurso: true,
      tipoRecurso: 'recurso_conversacion',
      personajeNombre: 'Dr. Cerebro',
      personajeUrl: 'https://i.redd.it/1leqbt052gj41.png',
      backgroundUrl:
        'https://cdna.artstation.com/p/assets/images/images/040/915/304/large/alexander-sord-night-get.jpg?1630252220',
    },
  ];

  emptyRecurso: MixRecursosType = {
    mensaje: '',
    siguienteRecursoId: undefined,
    recursoId: '',
    escenaId: '',
    primerRecurso: false,
    ultimoRecurso: false,
    tipoRecurso: '',
    personajeNombre: '',
    personajeUrl: '',
    backgroundUrl: '',
  };

  currentRecurso: MixRecursosType = {
    ...this.emptyRecurso,
  };

  constructor(private signupService: SignupService) {}

  ngOnInit(): void {
    this.changeRecurso(this.currentRecursoId);
    this.addLecturaRecurso(this.currentRecursoId);
  }

  addLecturaRecurso(recursoId: string): void {
    this.lecturaRecursos.push(recursoId);
  }

  removeLecturaRecurso(): string | undefined {
    this.lecturaRecursos.pop();
    return this.lecturaRecursos[this.lecturaRecursos.length - 1];
  }

  changeRecurso(recursoId: string): void {
    const nuevoRecurso = this.loginRecursos.find(
      recurso => recurso.recursoId === recursoId
    );

    console.log('changeRecurso', nuevoRecurso);

    this.currentRecurso = nuevoRecurso || { ...this.emptyRecurso };
    this.currentRecursoId = this.currentRecurso.recursoId;
  }

  onClickNextRecurso(): void {
    if (instanceOfIConversacion(this.currentRecurso)) {
      const siguienteRecursoId = this.currentRecurso.siguienteRecursoId || '';

      if (siguienteRecursoId) {
        this.changeRecurso(siguienteRecursoId);
        this.addLecturaRecurso(this.currentRecursoId);
      }
    }
  }

  onClickPreviousRecurso(): void {
    if (this.lecturaRecursos.length > 1) {
      const previousRecursoId = this.removeLecturaRecurso();
      if (previousRecursoId) {
        this.changeRecurso(previousRecursoId);
        this.currentRecursoId = previousRecursoId;
      }
    }

    console.log('LECTURAS', this.lecturaRecursos);
  }

  handleEntradaEmit(email: string) {
    if (instanceOfIEntrada(this.currentRecurso)) {
      this.currentRecurso.valor = email;
      const siguienteRecursoId = this.currentRecurso.siguienteRecursoId || '';
      this.changeRecurso(siguienteRecursoId);
    }
  }
}
