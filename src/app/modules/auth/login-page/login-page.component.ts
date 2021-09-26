import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.reducer';
import * as usuarioActions from 'src/app/store/usuarios/usuarios.actions';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  loginForm: FormGroup;

  constructor(private formBuilder: FormBuilder, private store: Store<AppState>) {
    this.loginForm = this.formBuilder.group({
      nickname: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmitLogin() {
    if(this.loginForm.valid) {

      const nick = this.loginForm.get('nickname')?.value;
      const pass = this.loginForm.get('password')?.value;

      this.store.dispatch(usuarioActions.POST_LOGIN({ payload: {nickname: nick, password: pass} }));
    }
    else {

    }
  }

}
