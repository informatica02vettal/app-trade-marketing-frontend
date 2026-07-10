import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-shell/dashboard-shell').then((m) => m.DashboardShell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./kpis/kpis').then((m) => m.Kpis) },
      {
        path: 'planificacion',
        loadComponent: () => import('./planificacion/planificacion').then((m) => m.Planificacion),
      },
      { path: 'visitas', loadComponent: () => import('./visitas/visitas').then((m) => m.Visitas) },
      { path: 'solicitudes', loadComponent: () => import('./solicitudes/solicitudes').then((m) => m.Solicitudes) },
      { path: 'mercado', loadComponent: () => import('./mercado/mercado').then((m) => m.Mercado) },
      { path: 'catalogos', loadComponent: () => import('./catalogos/catalogos').then((m) => m.Catalogos) },
    ],
  },
];
