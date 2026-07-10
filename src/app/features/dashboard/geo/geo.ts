import { Component, OnInit, inject, signal } from '@angular/core';
import { KpiService } from '../../../core/services/kpi.service';
import { CoberturaRegion } from '../../../core/models/kpi.model';

@Component({
  selector: 'app-geo',
  standalone: true,
  templateUrl: './geo.html',
})
export class Geo implements OnInit {
  private readonly kpiService = inject(KpiService);

  readonly coberturaPorRegion = signal<CoberturaRegion[]>([]);

  ngOnInit(): void {
    this.kpiService.obtenerDashboard().subscribe((k) => this.coberturaPorRegion.set(k.coberturaPorRegion));
  }
}
