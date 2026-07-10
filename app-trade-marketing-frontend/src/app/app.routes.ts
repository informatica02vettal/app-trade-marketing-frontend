import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () => import('./features/mercaderista/mercaderista.routes').then((m) => m.MERCADERISTA_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['ADMIN', 'SUPERVISOR'])],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  { path: '**', redirectTo: 'login' },
];
