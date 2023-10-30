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

  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faCog = faCog;

  currentRecursoId: string = '1';
  currentRecurso!: MixRecursosType;

  constructor(private signupService: SignupService) {}

  ngOnInit(): void {}
}
