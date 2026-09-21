import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';
import { IUsuario } from '@models/usuario.interfaces';
import { Observable } from 'rxjs';

import { userDataResolver } from './user-data.resolver';

describe('userDataResolver', () => {
  const executeResolver: ResolveFn<Observable<IUsuario>> = (...resolverParameters) =>
      TestBed.runInInjectionContext(() => userDataResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
