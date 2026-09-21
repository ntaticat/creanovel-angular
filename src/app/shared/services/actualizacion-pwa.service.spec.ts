import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { ActualizacionPwaService, RECARGAR_PAGINA } from './actualizacion-pwa.service';

describe('ActualizacionPwaService', () => {
  let versiones: Subject<VersionEvent>;
  let irrecuperable: Subject<unknown>;
  let sw: { isEnabled: boolean; versionUpdates: Subject<VersionEvent>; unrecoverable: Subject<unknown>; checkForUpdate: jasmine.Spy; activateUpdate: jasmine.Spy };
  let recargar: jasmine.Spy;

  function crear(swActivo = true): ActualizacionPwaService {
    versiones = new Subject<VersionEvent>();
    irrecuperable = new Subject<unknown>();
    recargar = jasmine.createSpy('recargar');
    sw = {
      isEnabled: swActivo,
      versionUpdates: versiones,
      unrecoverable: irrecuperable,
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false),
      activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(true),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        { provide: RECARGAR_PAGINA, useValue: recargar },
      ],
    });
    return TestBed.inject(ActualizacionPwaService);
  }

  const versionLista = { type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } } as VersionEvent;

  it('sin service worker (desarrollo, tests) no hace nada', () => {
    TestBed.configureTestingModule({});
    const servicio = TestBed.inject(ActualizacionPwaService);

    expect(servicio.aviso()).toBeNull();
  });

  it('con el service worker desactivado tampoco escucha nada', () => {
    const servicio = crear(false);

    versiones.next(versionLista);

    expect(servicio.aviso()).toBeNull();
  });

  it('avisa cuando hay una versión nueva lista, y solo entonces', () => {
    const servicio = crear();

    versiones.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } } as VersionEvent);
    expect(servicio.aviso()).toBeNull();

    versiones.next(versionLista);
    expect(servicio.aviso()).toBe('nueva-version');
  });

  it('avisa si el service worker se queda con archivos que ya no existen', () => {
    const servicio = crear();

    irrecuperable.next({ type: 'UNRECOVERABLE_STATE', reason: 'hash mismatch' });

    expect(servicio.aviso()).toBe('desincronizada');
  });

  it('actualizar activa la versión nueva y recarga, en ese orden', async () => {
    const servicio = crear();
    versiones.next(versionLista);
    const orden: string[] = [];
    sw.activateUpdate.and.callFake(async () => { orden.push('activar'); return true; });
    recargar.and.callFake(() => orden.push('recargar'));

    await servicio.actualizar();

    expect(orden).toEqual(['activar', 'recargar']);
  });

  it('si el service worker está desincronizado solo recarga (no hay nada que activar)', async () => {
    const servicio = crear();
    irrecuperable.next({});

    await servicio.actualizar();

    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it('recarga aunque activar la versión falle', async () => {
    const servicio = crear();
    versiones.next(versionLista);
    sw.activateUpdate.and.rejectWith(new Error('sin red'));

    await servicio.actualizar().catch(() => undefined);

    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it('descartar quita el aviso sin recargar', () => {
    const servicio = crear();
    versiones.next(versionLista);

    servicio.descartar();

    expect(servicio.aviso()).toBeNull();
    expect(recargar).not.toHaveBeenCalled();
  });

  it('al volver a la pestaña pregunta si hay versión nueva; oculta no', () => {
    crear();
    const estado = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')!;
    const poner = (valor: DocumentVisibilityState) =>
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => valor });
    try {
      poner('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(sw.checkForUpdate).not.toHaveBeenCalled();

      poner('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
    } finally {
      delete (document as unknown as Record<string, unknown>)['visibilityState'];
      expect(Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')).toEqual(estado);
    }
  });

  it('una revisión que falla (sin red) no rompe nada', async () => {
    crear();
    sw.checkForUpdate.and.rejectWith(new Error('offline'));
    const estado = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')!;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    try {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
      await Promise.resolve();
    } finally {
      delete (document as unknown as Record<string, unknown>)['visibilityState'];
      expect(Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')).toEqual(estado);
    }
  });
});
