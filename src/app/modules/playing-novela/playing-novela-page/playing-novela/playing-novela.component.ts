import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IConversacion, IDecision } from '@models/recurso.interfaces';

@Component({
  selector: 'app-playing-novela',
  templateUrl: './playing-novela.component.html',
  styleUrls: ['./playing-novela.component.scss'],
})
export class PlayingNovelaComponent implements OnInit {
  @Input() novelaId: string = '';
  recursoActual?: IDecision | IConversacion;
  loadedSuccess = false;

  constructor() {}

  ngOnInit(): void {}
}
