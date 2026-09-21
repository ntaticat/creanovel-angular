import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActualizacionPwaService } from 'src/app/shared/services/actualizacion-pwa.service';

/** Aviso discreto (abajo) de que hay una versión nueva de la app. Ver `ActualizacionPwaService`. */
@Component({
  selector: 'app-aviso-actualizacion',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (servicio.aviso(); as aviso) {
      <div
        role="status"
        aria-live="polite"
        class="fixed z-[100] bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm flex items-center gap-3 rounded-xl bg-gray-900 text-white text-sm px-4 py-3 shadow-2xl ring-1 ring-white/10">
        <p class="flex-1">
          {{
            aviso === 'nueva-version'
              ? 'Hay una versión nueva de CreaNovel.'
              : 'La app se desincronizó y hay que recargarla.'
          }}
        </p>
        <button type="button" class="btn-primary" (click)="servicio.actualizar()">
          {{ aviso === 'nueva-version' ? 'Actualizar' : 'Recargar' }}
        </button>
        @if (aviso === 'nueva-version') {
          <button type="button" class="btn-ghost !text-white/70 hover:!bg-white/10" (click)="servicio.descartar()">
            Luego
          </button>
        }
      </div>
    }
  `,
})
export class AvisoActualizacionComponent {
  readonly servicio = inject(ActualizacionPwaService);
}
