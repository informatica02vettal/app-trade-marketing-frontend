import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { VisitaService } from '../../../core/services/visita.service';
import { Visita } from '../../../core/models/visita.model';
import { BADGE_INFO, BADGE_NEUTRAL, BADGE_OK } from '../../../shared/ui/dash/badge-classes';

const BADGE_CLASE: Record<string, string> = { COMPLETADA: BADGE_OK, EN_CURSO: BADGE_INFO };

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './visitas.html',
})
export class Visitas implements OnInit {
  private readonly visitaService = inject(VisitaService);

  readonly badgeClase = BADGE_CLASE;
  readonly badgeNeutral = BADGE_NEUTRAL;
  readonly visitas = signal<Visita[]>([]);

  ngOnInit(): void {
    this.visitaService.listar().subscribe((visitas) => this.visitas.set(visitas));
  }
}
