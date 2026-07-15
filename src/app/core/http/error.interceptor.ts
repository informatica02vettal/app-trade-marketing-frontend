import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { ApiResponse } from '../models/api-response.model';

function extraerMensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as ApiResponse<unknown> | undefined;
    if (cuerpo?.errors && Object.keys(cuerpo.errors).length) {
      // "Error de validación" a secas no dice qué campo falló ni por qué —
      // se agregan los detalles por campo que ya manda el backend.
      const detalles = Object.values(cuerpo.errors).join(' · ');
      return cuerpo.message ? `${cuerpo.message}: ${detalles}` : detalles;
    }
    if (cuerpo?.message) return cuerpo.message;
    if (error.status === 0) return 'No fue posible conectar con el servidor';
    return `Error inesperado (HTTP ${error.status})`;
  }
  return 'Ocurrió un error inesperado';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      toastService.mostrarError(extraerMensajeError(error));
      return throwError(() => error);
    }),
  );
};
