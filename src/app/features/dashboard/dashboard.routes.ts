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
      { path: 'evidencia', loadComponent: () => import('./evidencia/evidencia').then((m) => m.Evidencia) },
      { path: 'auditoria', loadComponent: () => import('./auditoria/auditoria').then((m) => m.Auditoria) },
      { path: 'solicitudes', loadComponent: () => import('./solicitudes/solicitudes').then((m) => m.Solicitudes) },
      { path: 'pop', loadComponent: () => import('./pop/pop').then((m) => m.Pop) },
      { path: 'mercado', loadComponent: () => import('./mercado/mercado').then((m) => m.Mercado) },
      { path: 'geo', loadComponent: () => import('./geo/geo').then((m) => m.Geo) },
      { path: 'kpis', loadComponent: () => import('./kpis/kpis').then((m) => m.Kpis) },
      { path: 'fase2', loadComponent: () => import('./fase2/fase2').then((m) => m.Fase2) },
      { path: 'catalogos', loadComponent: () => import('./catalogos/catalogos').then((m) => m.Catalogos) },
    ],
  },
];
