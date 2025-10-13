import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

const ensureAuthHeaders = (req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> => {
  const setHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  return req.clone({
    withCredentials: true,
    setHeaders
  });
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const shouldSkipAuthHeader = authService.shouldSkipAuthHeader(req.url);

  const requestWithAuth = shouldSkipAuthHeader ? req.clone({ withCredentials: true }) : ensureAuthHeaders(req, token);

  return next(requestWithAuth).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        if (authService.shouldSkipRefresh(req.url)) {
          authService.handleAuthFailure();
          return throwError(() => error);
        }

        return authService.refreshAccessToken().pipe(
          switchMap(newToken => {
            if (!newToken) {
              authService.handleAuthFailure();
              return throwError(() => error);
            }
            const retryRequest = ensureAuthHeaders(req, newToken);
            return next(retryRequest);
          }),
          catchError(refreshError => {
            authService.handleAuthFailure();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
