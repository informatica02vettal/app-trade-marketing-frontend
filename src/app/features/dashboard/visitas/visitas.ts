import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { VisitaService } from '../../../core/services/visita.service';
import { Visita } from '../../../core/models/visita.model';

const BADGE_CLASE: Record<string, string> = { COMPLETADA: 'ok', EN_CURSO: 'info' };

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './visitas.html',
})
export class Visitas implements OnInit {
  private readonly visitaService = inject(VisitaService);

  readonly badgeClase = BADGE_CLASE;
  readonly visitas = signal<Visita[]>([]);

  ngOnInit(): void {
    this.visitaService.listar().subscribe((visitas) => this.visitas.set(visitas));
  }
}
