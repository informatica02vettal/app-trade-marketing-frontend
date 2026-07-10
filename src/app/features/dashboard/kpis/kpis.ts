import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { KpiService } from '../../../core/services/kpi.service';
import { KpiDashboard } from '../../../core/models/kpi.model';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './kpis.html',
})
export class Kpis implements OnInit {
  private readonly kpiService = inject(KpiService);

  readonly kpis = signal<KpiDashboard | null>(null);

  ngOnInit(): void {
    this.kpiService.obtenerDashboard().subscribe((data) => this.kpis.set(data));
  }
}
