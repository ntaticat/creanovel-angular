import {
  enableProdMode,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(APP_ROUTES),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    // El service worker solo existe en el build de producción: en desarrollo cachearía justo lo que se está editando.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch(err => console.error(err));
