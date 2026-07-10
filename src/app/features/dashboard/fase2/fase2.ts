import { Component } from '@angular/core';

@Component({
  selector: 'app-fase2',
  standalone: true,
  templateUrl: './fase2.html',
})
export class Fase2 {
  readonly alcancePrevisto = [
    'Integración con el módulo de ventas para cruzar visitas con facturación por cliente.',
    'Generación automática de leads a partir de oportunidades detectadas en campo.',
    'Seguimiento del ciclo completo de una oportunidad hasta su cierre comercial.',
    'Medición del impacto del Trade Marketing sobre la facturación por marca y región.',
  ];
}
