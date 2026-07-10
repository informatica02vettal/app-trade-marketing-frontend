import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RolUsuario } from '../models/usuario.model';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/login');
};

export const roleGuard = (rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const usuario = authService.usuarioActual();
    if (!usuario) {
      return router.parseUrl('/login');
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return router.parseUrl('/app/ruta');
    }
    return true;
  };
};
