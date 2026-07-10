import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-fase2',
  standalone: true,
  templateUrl: './fase2.html',
})
export class Fase2 implements AfterViewInit, OnDestroy {
  @ViewChild('chartFase2') chartRef?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  readonly alcancePrevisto = [
    'Integración con el módulo de ventas para cruzar visitas con facturación por cliente.',
    'Generación automática de leads a partir de oportunidades detectadas en campo.',
    'Seguimiento del ciclo completo de una oportunidad hasta su cierre comercial.',
    'Medición del impacto del Trade Marketing sobre la facturación por marca y región.',
  ];

  ngAfterViewInit(): void {
    if (!this.chartRef) return;
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
        datasets: [
          { label: 'Visitas', data: [40, 44, 42, 50, 55, 53], borderColor: '#24A9E1', backgroundColor: 'transparent', tension: 0.35, yAxisID: 'y' },
          { label: 'Ventas (miles $)', data: [62, 66, 60, 74, 80, 79], borderColor: '#58595B', backgroundColor: 'transparent', tension: 0.35, yAxisID: 'y1' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8A8C8E', font: { size: 10.5 } } } },
        scales: {
          x: { ticks: { color: '#8A8C8E', font: { size: 10 } }, grid: { display: false } },
          y: { type: 'linear', position: 'left', ticks: { color: '#8A8C8E', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.06)' } },
          y1: { type: 'linear', position: 'right', ticks: { color: '#8A8C8E', font: { size: 10 } }, grid: { display: false } },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
