import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-recurso-creator-form',
  templateUrl: './recurso-creator-form.component.html',
  styleUrls: ['./recurso-creator-form.component.scss'],
})
export class RecursoCreatorFormComponent implements OnInit {
  @Input('escenaId') escenaId: string = '';
  @Input('nextRecursoId') nextRecursoId: string = '';

  constructor() {}

  ngOnInit(): void {}
}
