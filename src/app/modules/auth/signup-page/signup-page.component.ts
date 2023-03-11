import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  faArrowRight,
  faArrowLeft,
  faCog,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-signup-page',
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent implements OnInit {
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faCog = faCog;

  signUpForm: UntypedFormGroup;

  formEnable: boolean = true;
  formIndex: number = 0;

  constructor(private fb: UntypedFormBuilder) {
    this.signUpForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      samePassword: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}

  onClickNextForm() {
    this.formIndex = this.formIndex + 1;
  }

  onSubmitSignUp() {
    if (this.signUpForm.valid) {
      const name = this.signUpForm.get('name')?.value;
      const username = this.signUpForm.get('username')?.value;
      const email = this.signUpForm.get('email')?.value;
      const password = this.signUpForm.get('password')?.value;

      const userPost = {
        name,
        username,
        email,
        password,
      };

      // this.store.dispatch(usuarioActions.POST_LOGIN({ payload: {...credentials} }));
    }
  }
}
