import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // provideRouter wires up the entire Angular Router with our route table. This is the
    // standalone equivalent of importing RouterModule.forRoot(routes) in the old NgModule world.
    provideRouter(routes),

    // provideHttpClient sets up the HttpClient for the whole app. withFetch() tells Angular to
    // use the native browser Fetch API under the hood instead of XMLHttpRequest, which plays
    // nicer with Angular's zoneless change detection and avoids some subtle CD timing issues
    // we ran into earlier. withInterceptors() registers our functional interceptor so every
    // outgoing HTTP request automatically gets the JWT header attached.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ],
};
