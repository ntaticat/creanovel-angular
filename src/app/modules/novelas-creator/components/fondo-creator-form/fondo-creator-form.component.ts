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
import { IBackground } from '@models/background.interfaces';
import { BackgroundsService } from '@services/backgrounds.service';
import { NovelasService } from '@services/novelas.service';
import { UploadsService } from '@services/uploads.service';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-fondo-creator-form',
  templateUrl: './fondo-creator-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SpinnerComponent,
    EmptyStateComponent,
  ],
})
export class FondoCreatorFormComponent implements OnInit {
  @Input() novelaId: string = '';
  @Output() backgroundAsociado = new EventEmitter<void>();

  modo: 'crear' | 'existente' = 'crear';
  guardando = false;

  faImage = faImage;

  backgroundForm: UntypedFormGroup = this.fb.group({
    descripcion: ['', Validators.required],
  });
  spriteFile?: File;

  backgroundsExistentes: IBackground[] = [];
  filtro: string = '';
  backgroundExistenteId: string = '';

  constructor(
    private fb: UntypedFormBuilder,
    private backgroundsService: BackgroundsService,
    private novelasService: NovelasService,
    private uploadsService: UploadsService
  ) {}

  ngOnInit(): void {
    this.backgroundsService.getBackgrounds().subscribe(backgrounds => {
      this.backgroundsExistentes = backgrounds;
    });
  }

  get backgroundsFiltrados(): IBackground[] {
    const filtro = this.filtro.trim().toLowerCase();
    if (!filtro) {
      return this.backgroundsExistentes;
    }
    return this.backgroundsExistentes.filter(b =>
      b.descripcion.toLowerCase().includes(filtro)
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.spriteFile = input.files?.[0];
  }

  onSubmitCrear() {
    if (!this.backgroundForm.valid || this.guardando) {
      return;
    }
    this.guardando = true;
    const descripcion = this.backgroundForm.value.descripcion;

    this.backgroundsService
      .postBackground({ descripcion })
      .subscribe(backgroundId => {
        const attachAndFinish = () => {
          this.novelasService
            .postNovelaBackground({ novelaId: this.novelaId, backgroundId })
            .subscribe(() => {
              this.guardando = false;
              this.backgroundForm.reset();
              this.spriteFile = undefined;
              this.backgroundAsociado.emit();
            });
        };

        if (this.spriteFile) {
          this.uploadsService
            .postUpload(this.spriteFile, 'backgrounds')
            .subscribe(({ url }) => {
              this.backgroundsService
                .postBackgroundSprite({
                  nombre: descripcion,
                  direccionImagen: url,
                  backgroundId,
                })
                .subscribe(() => attachAndFinish());
            });
        } else {
          attachAndFinish();
        }
      });
  }

  onSubmitExistente() {
    if (!this.backgroundExistenteId || this.guardando) {
      return;
    }
    this.guardando = true;

    this.novelasService
      .postNovelaBackground({
        novelaId: this.novelaId,
        backgroundId: this.backgroundExistenteId,
      })
      .subscribe(() => {
        this.guardando = false;
        this.backgroundExistenteId = '';
        this.backgroundAsociado.emit();
      });
  }
}
