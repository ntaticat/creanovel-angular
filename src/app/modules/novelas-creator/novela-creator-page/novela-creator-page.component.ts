import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { IEscena, IEscenaPost } from '@models/escena.interfaces';
import {
  instanceOfIConversacion,
  instanceOfIDecision,
} from '@models/recurso.interfaces';
import { fromEvent } from 'rxjs';
import { NovelasService } from '@services/novelas.service';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { INovelaVersion } from '@models/novela-version.interfaces';
import { EscenasService } from '@services/escenas.service';
import { RecursosService } from '@services/recursos.service';
import { NovelasCreatorPageComponent } from '../novelas-creator-page/novelas-creator-page.component';

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  styleUrls: ['./novela-creator-page.component.scss'],
})
export class NovelaCreatorPageComponent implements OnInit {
  instanceOfIConversacion = instanceOfIConversacion;
  instanceOfIDecision = instanceOfIDecision;

  faIcons = faIcons;

  novelaVersionId: string = '';
  novelaInfo?: INovelaVersion;
  escenaInfo?: IEscena;

  showModalActions: boolean = false;
  showModalRecursoInfo: boolean = false;
  showModalRecursoDelete: boolean = false;
  showModalEscena: boolean = false;

  showRecursoCreatorForm: boolean = false;
  showEscenaCreatorForm: boolean = false;

  selectedNodeRecursoId: string = '';

  INFO: boolean = false;
  DELETE: boolean = false;

  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required],
  });

  mousePositionX: number = 0;
  escenaSidebarWidth: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private novelasVersionesService: NovelasVersionesService,
    private escenasService: EscenasService,
    private recursosService: RecursosService
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaVersionId = params['id'];
    });
  }

  ngOnInit(): void {
    this.novelasVersionesService
      .getNovelaVersion(this.novelaVersionId)
      .subscribe(novelaVersion => {
        this.novelaInfo = novelaVersion;
      });
  }

  onSubmitEscena() {
    if (!this.escenaForm.valid) {
      return;
    }
    const escenaPost: IEscenaPost = {
      ...this.escenaForm.value,
      primerEscena: false,
      ultimaEscena: false,
    };
    escenaPost.novelaVersionId = this.novelaVersionId!;
  }

  onClickEscena(escenaId: string) {
    this.escenasService.getEscena(escenaId).subscribe(escena => {
      this.escenaInfo = escena;
    });
  }

  onSelectNodeShowModalActions(recursoId: string) {
    this.selectedNodeRecursoId = recursoId;
    this.showModalActions = true;
    this.showSpecificModalAction('INFO');
  }

  onClickCloseModalActions() {
    this.showModalActions = false;
    this.selectedNodeRecursoId = '';
  }

  onClickShowDeleteModal() {
    this.showSpecificModalAction('DELETE');
  }

  toggleShowModalActions() {
    this.showModalActions = !this.showModalActions;
  }

  onClickDeleteRecurso() {
    this.deleteRecurso(this.selectedNodeRecursoId);
    this.onClickEscena(this.escenaInfo?.escenaId || '');
  }

  deleteRecurso(recursoId: string) {
    this.recursosService.deleteRecurso(recursoId).subscribe();
    this.onClickCloseModalActions();
    this.showModalRecursoDelete = false;
  }

  showSpecificModalAction(value?: string) {
    this.showModalActions = true;
    switch (value) {
      case 'ESCENA':
        this.showModalRecursoDelete = false;
        this.showModalRecursoInfo = false;
        this.showModalEscena = true;
        break;
      case 'INFO':
        this.showModalRecursoDelete = false;
        this.showModalRecursoInfo = true;
        this.showModalEscena = false;
        break;
      case 'DELETE':
        this.showModalRecursoDelete = true;
        this.showModalRecursoInfo = false;
        this.showModalEscena = false;
        break;

      default:
        this.showModalRecursoInfo = false;
        this.showModalRecursoDelete = false;
        this.showModalEscena = false;
        this.showModalActions = false;
        break;
    }
  }
}
