import { TestBed } from '@angular/core/testing';

import { NovelasVersionesService } from './novelas-versiones.service';

describe('NovelasVersionesService', () => {
  let service: NovelasVersionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NovelasVersionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
