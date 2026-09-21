import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IPersonaje, IPersonajeSprite } from '@models/personaje.interfaces';
import { PersonajesService } from '@services/personajes.service';
import { UploadsService } from '@services/uploads.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faUserGroup,
  faPlus,
  faPen,
  faTrash,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

interface ISpriteFormState {
  id?: string;
  nombre: string;
  direccionImagenRaw: string;
  imagenPreviaUrl: string;
}

@Component({
  selector: 'app-personajes-library-page',
  templateUrl: './personajes-library-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    FormsModule,
    FaIconComponent,
    SpinnerComponent,
    EmptyStateComponent,
  ],
})
export class PersonajesLibraryPageComponent implements OnInit {
  faArrowLeft = faArrowLeft;
  faUserGroup = faUserGroup;
  faPlus = faPlus;
  faPen = faPen;
  faTrash = faTrash;
  faImage = faImage;

  personajes: IPersonaje[] = [];
  filtro = '';

  personajeSeleccionado?: IPersonaje;

  nuevoPersonajeNombre = '';
  creandoPersonaje = false;

  spriteForm: ISpriteFormState | null = null;
  guardandoSprite = false;
  subiendoImagen = false;

  constructor(
    private personajesService: PersonajesService,
    private uploadsService: UploadsService
  ) {}

  ngOnInit(): void {
    this.cargarPersonajes();
  }

  cargarPersonajes(): void {
    this.personajesService.getPersonajes().subscribe(personajes => {
      this.personajes = personajes;

      if (this.personajeSeleccionado) {
        this.personajeSeleccionado =
          personajes.find(
            p => p.personajeId === this.personajeSeleccionado?.personajeId
          ) || undefined;
      }
    });
  }

  get personajesFiltrados(): IPersonaje[] {
    const filtro = this.filtro.trim().toLowerCase();
    if (!filtro) {
      return this.personajes;
    }
    return this.personajes.filter(p => p.nombre.toLowerCase().includes(filtro));
  }

  thumbnailDe(personaje: IPersonaje): IPersonajeSprite | undefined {
    return personaje.sprites?.[0];
  }

  resolverUrl(url?: string): string {
    return this.uploadsService.resolveUrl(url);
  }

  seleccionarPersonaje(personaje: IPersonaje): void {
    this.personajeSeleccionado = personaje;
    this.spriteForm = null;
  }

  onSubmitNuevoPersonaje(): void {
    if (!this.nuevoPersonajeNombre.trim() || this.creandoPersonaje) {
      return;
    }
    this.creandoPersonaje = true;

    this.personajesService
      .postPersonaje({ nombre: this.nuevoPersonajeNombre.trim() })
      .subscribe(personajeId => {
        this.creandoPersonaje = false;
        this.nuevoPersonajeNombre = '';
        this.personajesService
          .getPersonaje(personajeId)
          .subscribe(personaje => {
            this.personajes = [...this.personajes, personaje];
            this.seleccionarPersonaje(personaje);
          });
      });
  }

  onClickNuevoSprite(): void {
    this.spriteForm = {
      nombre: '',
      direccionImagenRaw: '',
      imagenPreviaUrl: '',
    };
  }

  onClickEditarSprite(sprite: IPersonajeSprite): void {
    this.spriteForm = {
      id: sprite.personajeSpriteId,
      nombre: sprite.nombre,
      direccionImagenRaw: sprite.direccionImagen,
      imagenPreviaUrl: this.resolverUrl(sprite.direccionImagen),
    };
  }

  onClickCancelarSprite(): void {
    this.spriteForm = null;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.spriteForm) {
      return;
    }

    this.subiendoImagen = true;
    this.uploadsService.postUpload(file, 'personajes').subscribe(({ url }) => {
      this.subiendoImagen = false;
      if (this.spriteForm) {
        this.spriteForm.direccionImagenRaw = url;
        this.spriteForm.imagenPreviaUrl = this.resolverUrl(url);
      }
    });
  }

  onGuardarSprite(): void {
    if (
      !this.spriteForm ||
      !this.spriteForm.nombre.trim() ||
      !this.spriteForm.direccionImagenRaw ||
      !this.personajeSeleccionado ||
      this.guardandoSprite
    ) {
      return;
    }

    this.guardandoSprite = true;
    const form = this.spriteForm;

    const alGuardar = () => {
      this.guardandoSprite = false;
      this.spriteForm = null;
      this.personajesService
        .getPersonaje(this.personajeSeleccionado!.personajeId)
        .subscribe(personaje => {
          this.personajeSeleccionado = personaje;
          this.cargarPersonajes();
        });
    };

    if (form.id) {
      this.personajesService
        .patchPersonajeSprite(form.id, {
          nombre: form.nombre,
          direccionImagen: form.direccionImagenRaw,
        })
        .subscribe(alGuardar);
    } else {
      this.personajesService
        .postPersonajeSprite({
          nombre: form.nombre,
          direccionImagen: form.direccionImagenRaw,
          personajeId: this.personajeSeleccionado.personajeId,
        })
        .subscribe(alGuardar);
    }
  }

  onEliminarSprite(sprite: IPersonajeSprite): void {
    if (!confirm(`¿Eliminar el sprite "${sprite.nombre}"?`)) {
      return;
    }
    this.personajesService
      .deletePersonajeSprite(sprite.personajeSpriteId)
      .subscribe(() => {
        if (this.personajeSeleccionado) {
          this.personajesService
            .getPersonaje(this.personajeSeleccionado.personajeId)
            .subscribe(personaje => {
              this.personajeSeleccionado = personaje;
              this.cargarPersonajes();
            });
        }
      });
  }
}
