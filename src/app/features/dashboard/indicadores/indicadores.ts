import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { KpiService } from '../../../core/services/kpi.service';
import { KpiDashboard } from '../../../core/models/kpi.model';

interface FilaIndicador {
  nombre: string;
  valor: string | number;
  detalle: string;
}

@Component({
  selector: 'app-indicadores',
  standalone: true,
  templateUrl: './indicadores.html',
})
export class Indicadores implements OnInit {
  private readonly kpiService = inject(KpiService);

  readonly kpis = signal<KpiDashboard | null>(null);

  readonly filas = computed<FilaIndicador[]>(() => {
    const k = this.kpis();
    if (!k) return [];
    return [
      { nombre: 'Cumplimiento de visitas', valor: `${Math.round(k.cumplimientoVisitasPct)}%`, detalle: 'Ejecutadas / planificadas' },
      { nombre: 'Visitas planificadas', valor: k.visitasPlanificadas, detalle: 'Periodo actual' },
      { nombre: 'Visitas ejecutadas', valor: k.visitasEjecutadas, detalle: 'Periodo actual' },
      { nombre: 'Clientes atendidos', valor: k.clientesAtendidos, detalle: 'Con al menos una visita completada' },
      { nombre: 'Presencia de marca', valor: `${Math.round(k.presenciaMarcaPct)}%`, detalle: 'Promedio de auditorías' },
      { nombre: 'Participación de anaquel', valor: `${Math.round(k.participacionAnaquelPct)}%`, detalle: 'Promedio de espacio ocupado' },
      { nombre: 'Oportunidades detectadas', valor: k.oportunidadesDetectadas, detalle: 'Pendientes de gestión' },
      { nombre: 'Solicitudes generadas', valor: k.solicitudesGeneradas, detalle: 'Generadas este periodo' },
    ];
  });

  ngOnInit(): void {
    this.kpiService.obtenerDashboard().subscribe((k) => this.kpis.set(k));
  }
}
