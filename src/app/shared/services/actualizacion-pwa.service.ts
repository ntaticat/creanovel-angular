import { DestroyRef, inject, Injectable, InjectionToken, NgZone, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, fromEvent, interval, merge } from 'rxjs';

/** Qué le decimos al usuario: hay una versión nueva descargada, o el service worker se quedó con archivos que ya no existen. */
export type AvisoPwa = 'nueva-version' | 'desincronizada';

/** Cada cuánto se pregunta por una versión nueva mientras la pestaña sigue abierta (además de al arrancar y al volver a ella). */
export const INTERVALO_REVISION_PWA_MS = 60 * 60 * 1000;

/** Recarga la página. Es un token para poder sustituirlo en los tests. */
export const RECARGAR_PAGINA = new InjectionToken<() => void>('RECARGAR_PAGINA', {
  providedIn: 'root',
  factory: () => () => location.reload(),
});

/**
 * Vigila las versiones nuevas de la app instalada (service worker). No recarga sola —se perdería lo que el autor
 * tenga sin guardar en el editor—: avisa, y el usuario decide cuándo. Sin service worker (desarrollo, tests) no hace nada.
 */
@Injectable({ providedIn: 'root' })
export class ActualizacionPwaService {
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly recargar = inject(RECARGAR_PAGINA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zona = inject(NgZone);

  readonly aviso = signal<AvisoPwa | null>(null);

  constructor() {
    const sw = this.sw;
    if (!sw?.isEnabled) {
      return;
    }

    sw.versionUpdates
      .pipe(
        filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.aviso.set('nueva-version'));

    sw.unrecoverable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.aviso.set('desincronizada'));

    // Fuera de la zona: un `interval` dentro de ella mantiene la app "inestable" para siempre, y con
    // `registerWhenStable:30000` el service worker no se registraría hasta pasados los 30 s.
    this.zona.runOutsideAngular(() =>
      merge(
        fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible')),
        interval(INTERVALO_REVISION_PWA_MS)
      )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => void this.revisar())
    );
  }

  descartar(): void {
    this.aviso.set(null);
  }

  /** Activa la versión descargada (si la hay) y recarga para usarla. */
  async actualizar(): Promise<void> {
    try {
      if (this.aviso() === 'nueva-version') {
        await this.sw?.activateUpdate();
      }
    } finally {
      this.recargar();
    }
  }

  private async revisar(): Promise<void> {
    try {
      await this.sw?.checkForUpdate();
    } catch {
      // Sin red no hay nada que revisar: se volverá a intentar solo.
    }
  }
}
