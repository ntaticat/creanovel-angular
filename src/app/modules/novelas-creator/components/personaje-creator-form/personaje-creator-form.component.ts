import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { INovela } from '@models/novela.interfaces';
import { IPersonaje } from '@models/personaje.interfaces';
import { PersonajesService } from '@services/personajes.service';
import { NovelasService } from '@services/novelas.service';
import { UploadsService } from '@services/uploads.service';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-personaje-creator-form',
  templateUrl: './personaje-creator-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    FaIconComponent,
    SpinnerComponent,
    EmptyStateComponent,
  ],
})
export class PersonajeCreatorFormComponent implements OnInit {
  @Input() novelaId: string = '';
  @Input() novela?: INovela;
  @Output() personajeAsociado = new EventEmitter<void>();

  modo: 'crear' | 'existente' = 'crear';
  guardando = false;
  subiendoImagen = false;

  faCheck = faCheck;
  faUserGroup = faUserGroup;

  personajeForm: UntypedFormGroup = this.fb.group({
    nombre: ['', Validators.required],
  });
  imagenRaw = '';
  imagenPreviaUrl = '';

  personajesExistentes: IPersonaje[] = [];
  filtro: string = '';

  constructor(
    private fb: UntypedFormBuilder,
    private personajesService: PersonajesService,
    private novelasService: NovelasService,
    private uploadsService: UploadsService
  ) {}

  ngOnInit(): void {
    this.personajesService.getPersonajes().subscribe(personajes => {
      this.personajesExistentes = personajes;
    });
  }

  get personajesFiltrados(): IPersonaje[] {
    const filtro = this.filtro.trim().toLowerCase();
    if (!filtro) {
      return this.personajesExistentes;
    }
    return this.personajesExistentes.filter(p =>
      p.nombre.toLowerCase().includes(filtro)
    );
  }

  yaAsociado(personaje: IPersonaje): boolean {
    return !!this.novela?.personajes?.some(
      p => p.personajeId === personaje.personajeId
    );
  }

  resolverUrl(url?: string): string {
    return this.uploadsService.resolveUrl(url);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.subiendoImagen = true;
    this.uploadsService.postUpload(file, 'personajes').subscribe(({ url }) => {
      this.subiendoImagen = false;
      this.imagenRaw = url;
      this.imagenPreviaUrl = this.resolverUrl(url);
    });
  }

  onSubmitCrear() {
    if (!this.personajeForm.valid || !this.imagenRaw || this.guardando) {
      return;
    }
    this.guardando = true;
    const nombre = this.personajeForm.value.nombre;

    this.personajesService.postPersonaje({ nombre }).subscribe(personajeId => {
      this.personajesService
        .postPersonajeSprite({
          nombre,
          direccionImagen: this.imagenRaw,
          personajeId,
        })
        .subscribe(() => {
          this.novelasService
            .postNovelaPersonaje({ novelaId: this.novelaId, personajeId })
            .subscribe(() => {
              this.guardando = false;
              this.personajeForm.reset();
              this.imagenRaw = '';
              this.imagenPreviaUrl = '';
              this.personajeAsociado.emit();
            });
        });
    });
  }

  onSubmitExistente(personaje: IPersonaje) {
    if (this.guardando || this.yaAsociado(personaje)) {
      return;
    }
    this.guardando = true;

    this.novelasService
      .postNovelaPersonaje({
        novelaId: this.novelaId,
        personajeId: personaje.personajeId,
      })
      .subscribe(() => {
        this.guardando = false;
        this.personajeAsociado.emit();
      });
  }
}
