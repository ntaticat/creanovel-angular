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

@Component({
  selector: 'app-novela-creator-page',
  templateUrl: './novela-creator-page.component.html',
  styleUrls: ['./novela-creator-page.component.scss'],
})
export class NovelaCreatorPageComponent implements OnInit {
  @ViewChild('escenasSidebar') escenasSidebar!: ElementRef;
  @ViewChild('escenasSidebarResizer') escenasSidebarResizer!: ElementRef;

  instanceOfIConversacion = instanceOfIConversacion;
  instanceOfIDecision = instanceOfIDecision;

  faIcons = faIcons;

  novelaId: string = '';
  novelaInfo?: INovela;
  escenaInfo?: IEscena;

  escenaForm: UntypedFormGroup = this.fb.group({
    identificador: ['', Validators.required],
  });

  mousePositionX: number = 0;
  escenaSidebarWidth: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: UntypedFormBuilder
  ) {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params['id'];
    });
  }

  ngOnInit(): void {
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
    escenaPost.novelaId = this.novelaId!;
  }

  onClickEscena(escenaId: string) {
  }

  onMouseDownEscenaResizer(e: MouseEvent) {
    this.mousePositionX = e.clientX;
    let sidebarWidth = window.getComputedStyle(
      this.escenasSidebar.nativeElement
    ).width;
    this.escenaSidebarWidth = parseInt(sidebarWidth, 10);

    console.log('DOWN X:', this.mousePositionX);
    console.log('DOWN WIDTH:', this.escenaSidebarWidth);
  }

  onMouseUpEscenaResizer(e: MouseEvent) {}

  onMouseMoveEscenaResizer(e: MouseEvent) {
    let newXValue = e.clientX - this.mousePositionX;
    let newWidthValue = this.escenaSidebarWidth + newXValue;

    console.log(newXValue);

    // if (newWidthValue < 700) {
    //   window.getComputedStyle(
    //     this.escenasSidebar.nativeElement
    //   ).width = `${newWidthValue}px`;
    // }
  }
}
