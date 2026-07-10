import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, effect, inject, signal, viewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { KpiService } from '../../../core/services/kpi.service';
import { MercadoService } from '../../../core/services/mercado.service';
import { KpiDashboard } from '../../../core/models/kpi.model';
import { HallazgoMercado } from '../../../core/models/mercado.model';
import { BADGE_BAD, BADGE_OK, BADGE_WARN } from '../../../shared/ui/dash/badge-classes';

function estadoCumplimiento(pct: number): { texto: string; clase: string } {
  if (pct >= 95) return { texto: 'Al día', clase: BADGE_OK };
  if (pct >= 75) return { texto: 'Atención', clase: BADGE_WARN };
  return { texto: 'Rezagado', clase: BADGE_BAD };
}

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './kpis.html',
})
export class Kpis implements OnDestroy {
  private readonly kpiService = inject(KpiService);
  private readonly mercadoService = inject(MercadoService);

  readonly chartPlanRef = viewChild<{ nativeElement: HTMLCanvasElement }>('chartPlan');
  readonly chartMarcaRef = viewChild<{ nativeElement: HTMLCanvasElement }>('chartMarca');

  readonly kpis = signal<KpiDashboard | null>(null);
  readonly oportunidades = signal<HallazgoMercado[]>([]);
  readonly cargando = signal(true);

  readonly estadoCumplimiento = estadoCumplimiento;

  private chartPlan?: Chart;
  private chartMarca?: Chart;

  constructor() {
    this.actualizar();
    this.mercadoService.listar({ tipo: 'OBSERVACION_MERCADO' }).subscribe((h) => this.oportunidades.set(h.slice(0, 5)));

    effect(() => {
      const k = this.kpis();
      const planCanvas = this.chartPlanRef()?.nativeElement;
      const marcaCanvas = this.chartMarcaRef()?.nativeElement;
      if (!k || !planCanvas || !marcaCanvas) return;
      this.dibujarGraficos(k, planCanvas, marcaCanvas);
    });
  }

  ngOnDestroy(): void {
    this.chartPlan?.destroy();
    this.chartMarca?.destroy();
  }

  actualizar(): void {
    this.cargando.set(true);
    this.kpiService.obtenerDashboard().subscribe((data) => {
      this.kpis.set(data);
      this.cargando.set(false);
    });
  }

  private dibujarGraficos(data: KpiDashboard, planCanvas: HTMLCanvasElement, marcaCanvas: HTMLCanvasElement): void {
    this.chartPlan?.destroy();
    this.chartMarca?.destroy();

    this.chartPlan = new Chart(planCanvas, {
      type: 'bar',
      data: {
        labels: ['Planificadas', 'Ejecutadas'],
        datasets: [
          {
            data: [data.visitasPlanificadas, data.visitasEjecutadas],
            backgroundColor: ['rgba(143,160,172,.35)', '#24A9E1'],
            borderRadius: 4,
            barPercentage: 0.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8A8C8E', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#8A8C8E', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.06)' } },
        },
      },
    });

    this.chartMarca = new Chart(marcaCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Presencia de marca', 'Participación de anaquel'],
        datasets: [
          {
            data: [data.presenciaMarcaPct, data.participacionAnaquelPct],
            backgroundColor: ['#24A9E1', '#5BC2EA'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#8A8C8E', font: { size: 10.5 }, boxWidth: 9, padding: 8 } } },
      },
    });
  }
}
