import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { VisitaService } from '../../../core/services/visita.service';
import { AuditoriaMarca } from '../../../core/models/auditoria.model';
import { Visita } from '../../../core/models/visita.model';

const BADGE_EXHIBIDOR: Record<string, string> = { OPTIMO: 'ok', REGULAR: 'warn', DETERIORADO: 'bad', NO_APLICA: 'neutral' };
const BADGE_POP: Record<string, string> = { OPTIMO: 'ok', REGULAR: 'warn', FALTANTE: 'bad' };

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auditoria.html',
})
export class Auditoria implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly visitaService = inject(VisitaService);

  readonly badgeExhibidor = BADGE_EXHIBIDOR;
  readonly badgePop = BADGE_POP;

  readonly visitas = signal<Visita[]>([]);
  readonly visitaId = signal<number | null>(null);
  readonly auditorias = signal<AuditoriaMarca[]>([]);

  ngOnInit(): void {
    this.visitaService.listar().subscribe((visitas) => this.visitas.set(visitas));
  }

  onVisitaSeleccionada(visitaId: number | null): void {
    this.visitaId.set(visitaId);
    if (!visitaId) {
      this.auditorias.set([]);
      return;
    }
    this.auditoriaService.listarPorVisita(visitaId).subscribe((auditorias) => this.auditorias.set(auditorias));
  }
}
