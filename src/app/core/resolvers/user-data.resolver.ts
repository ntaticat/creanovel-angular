import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { IUsuario } from '@models/usuario.interfaces';
import { AuthService } from '@services/auth.service';
import { UsuariosService } from '@services/usuarios.service';
import { Observable } from 'rxjs';

export const userDataResolver: ResolveFn<Observable<IUsuario>> = (
  route,
  state,
  usuariosService: UsuariosService = inject(UsuariosService),
  authService: AuthService = inject(AuthService)
) => {
  const token = authService.readToken();
  const usuarioId = authService.decodeJWT(token).userId;
  return usuariosService.getUsuarioById(usuarioId);
};
