import { Routes } from '@angular/router';

export const MERCADERISTA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./mobile-shell/mobile-shell').then((m) => m.MobileShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ruta' },
      { path: 'ruta', loadComponent: () => import('./ruta/ruta').then((m) => m.Ruta) },
      { path: 'visita/:visitaId', loadComponent: () => import('./visita/visita-wizard').then((m) => m.VisitaWizard) },
      { path: 'perfil', loadComponent: () => import('./perfil/perfil').then((m) => m.Perfil) },
      {
        path: 'banco-imagenes',
        loadComponent: () => import('./banco-imagenes/banco-imagenes').then((m) => m.BancoImagenes),
      },
    ],
  },
];
