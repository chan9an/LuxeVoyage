import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// This is a functional interceptor — the modern Angular 17+ way to intercept HTTP requests
// without needing a class that implements HttpInterceptor. It's registered in app.config.ts
// via withInterceptors() and runs for every single outgoing HttpClient request in the app.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // We skip Cloudinary requests deliberately because Cloudinary uses its own upload preset
  // for auth and adding our JWT header to those requests would cause CORS errors. Every
  // other request to our own API gateway gets the Bearer token attached automatically,
  // which means individual services don't need to manually set Authorization headers.
  if (token && !req.url.includes('cloudinary.com')) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
