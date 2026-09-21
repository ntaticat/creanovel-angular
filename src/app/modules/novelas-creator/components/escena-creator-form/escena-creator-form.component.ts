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
import { IEscena, IEscenaPost } from '@models/escena.interfaces';
import { EscenasService } from '@services/escenas.service';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EtiquetasInputComponent } from '../etiquetas-input/etiquetas-input.component';

@Component({
  selector: 'app-escena-creator-form',
  templateUrl: './escena-creator-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ReactiveFormsModule, SpinnerComponent, EtiquetasInputComponent],
})
export class EscenaCreatorFormComponent implements OnInit {
  @Input() novelaVersionId: string = '';
  /** Si viene, el formulario edita esa escena (nombre y etiquetas) en lugar de crear una. */
  @Input() escena?: IEscena;
  /** Las etiquetas que ya usan las escenas de la versión, para sugerirlas. */
  @Input() etiquetasExistentes: string[] = [];
  @Output() escenaCreada = new EventEmitter<void>();
  @Output() escenaEditada = new EventEmitter<void>();

  guardando = false;

  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required],
    primerEscena: [false],
    ultimaEscena: [false],
    etiquetas: [[] as string[]],
  });

  constructor(
    private fb: UntypedFormBuilder,
    private escenasService: EscenasService
  ) {}

  ngOnInit(): void {
    if (this.escena) {
      this.escenaForm.patchValue({
        identificador: this.escena.identificador,
        etiquetas: [...(this.escena.etiquetas ?? [])],
      });
    }
  }

  get editando(): boolean {
    return !!this.escena;
  }

  onEtiquetasChange(etiquetas: string[]) {
    this.escenaForm.patchValue({ etiquetas });
    this.escenaForm.markAsDirty();
  }

  onSubmitEscena() {
    if (!this.escenaForm.valid || this.guardando) {
      return;
    }

    if (this.escena) {
      this.guardarCambios(this.escena);
      return;
    }

    const escenaPost: IEscenaPost = {
      ...this.escenaForm.value,
      novelaVersionId: this.novelaVersionId,
    };

    this.guardando = true;
    this.escenasService.postEscena(escenaPost).subscribe({
      next: () => {
        this.guardando = false;
        this.escenaForm.reset({
          identificador: '',
          primerEscena: false,
          ultimaEscena: false,
          etiquetas: [],
        });
        this.escenaCreada.emit();
      },
      error: () => (this.guardando = false),
    });
  }

  private guardarCambios(escena: IEscena) {
    const { identificador, etiquetas } = this.escenaForm.value as { identificador: string; etiquetas: string[] };
    const nombre = identificador.trim();

    // El servidor responde error cuando no cambia nada, así que sin cambios basta con cerrar.
    if (nombre === escena.identificador && sonIguales(etiquetas, escena.etiquetas ?? [])) {
      this.escenaEditada.emit();
      return;
    }

    this.guardando = true;
    this.escenasService.patchEscena(escena.escenaId, { identificador: nombre, etiquetas }).subscribe({
      next: () => {
        this.guardando = false;
        this.escenaEditada.emit();
      },
      error: () => (this.guardando = false),
    });
  }
}

const sonIguales = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((valor, i) => valor === b[i]);
