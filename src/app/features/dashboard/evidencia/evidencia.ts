import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { VisitaService } from '../../../core/services/visita.service';
import { Visita } from '../../../core/models/visita.model';

@Component({
  selector: 'app-evidencia',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './evidencia.html',
})
export class Evidencia implements OnInit {
  private readonly visitaService = inject(VisitaService);

  readonly visitas = signal<Visita[]>([]);

  ngOnInit(): void {
    this.visitaService.listar().subscribe((visitas) => this.visitas.set(visitas));
  }
}
