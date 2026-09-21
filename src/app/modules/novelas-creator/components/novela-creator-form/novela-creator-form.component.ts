import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
import { NovelasService } from '@services/novelas.service';
import { UploadsService } from '@services/uploads.service';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';

@Component({
  selector: 'app-novela-creator-form',
  templateUrl: './novela-creator-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, ReactiveFormsModule, SpinnerComponent],
})
export class NovelaCreatorFormComponent implements OnChanges {
  @Input() novela?: INovela;
  @Output() guardado = new EventEmitter<void>();

  guardando = false;
  portadaFile?: File;

  novelaForm: UntypedFormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  constructor(
    private fb: UntypedFormBuilder,
    private novelasService: NovelasService,
    private uploadsService: UploadsService
  ) {}

  ngOnChanges(): void {
    if (this.novela) {
      this.novelaForm.patchValue({
        titulo: this.novela.titulo,
        descripcion: this.novela.descripcion,
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.portadaFile = input.files?.[0];
  }

  onSubmitNovela() {
    if (!this.novelaForm.valid || !this.novela || this.guardando) {
      return;
    }

    this.guardando = true;

    const guardarCambios = (portadaImagenUrl?: string) => {
      this.novelasService
        .patchNovela(this.novela!.novelaId, {
          titulo: this.novelaForm.value.titulo,
          descripcion: this.novelaForm.value.descripcion,
          ...(portadaImagenUrl ? { portadaImagenUrl } : {}),
        })
        .subscribe(() => {
          this.guardando = false;
          this.portadaFile = undefined;
          this.guardado.emit();
        });
    };

    if (this.portadaFile) {
      this.uploadsService
        .postUpload(this.portadaFile, 'portadas')
        .subscribe(({ url }) => guardarCambios(url));
    } else {
      guardarCambios();
    }
  }
}
