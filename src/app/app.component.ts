import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AvisoActualizacionComponent } from './shared/components/aviso-actualizacion/aviso-actualizacion.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet, AvisoActualizacionComponent],
})
export class AppComponent {
  title = 'creanovel';

  /**
   * Este componente es la raíz *y* el de las rutas de layout (`app.routes.ts`), así que aparece anidado. El aviso de
   * actualización solo se dibuja en la instancia raíz, la única cuyo `ActivatedRoute` no tiene configuración de ruta.
   */
  esRaiz = inject(ActivatedRoute).routeConfig === null;
}
