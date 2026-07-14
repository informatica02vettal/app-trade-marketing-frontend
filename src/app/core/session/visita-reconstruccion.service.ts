import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { VisitaService } from '../services/visita.service';
import { AuditoriaService } from '../services/auditoria.service';
import { EventoService } from '../services/evento.service';
import { PlanVisitaService } from '../services/plan-visita.service';
import { EvidenciaFoto, Visita } from '../models/visita.model';
import { VisitaSessionService } from './visita-session.service';

export interface ReconstruccionResultado {
  fotos: EvidenciaFoto[];
}

/**
 * Reconstruye la sesión en memoria de una visita EN_CURSO leyendo
 * únicamente lo que ya quedó guardado en el backend (fotos, auditorías de
 * marca, evento, cliente prospecto). Es la única forma de "retomar" una
 * visita: no depende de localStorage/sessionStorage, así que funciona
 * igual aunque el mercaderista haya cambiado de teléfono.
 */
@Injectable({ providedIn: 'root' })
export class VisitaReconstruccionService {
  private readonly visitaService = inject(VisitaService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly eventoService = inject(EventoService);
  private readonly planVisitaService = inject(PlanVisitaService);
  private readonly sesion = inject(VisitaSessionService);

  reconstruir(visita: Visita): Observable<ReconstruccionResultado> {
    return forkJoin({
      fotos: this.visitaService.listarFotos(visita.id),
      auditorias: this.auditoriaService.listarPorVisita(visita.id),
      evento: this.eventoService.obtenerPorVisita(visita.id),
      prospectos: this.visitaService.listarClientesProspecto(visita.id),
      planes: visita.planId ? this.planVisitaService.listar(visita.usuarioId) : of([]),
    }).pipe(
      map(({ fotos, auditorias, evento, prospectos, planes }) => {
        const plan = visita.planId ? planes.find((p) => p.id === visita.planId) : undefined;
        const evidenciaCompleta =
          fotos.some((f) => f.categoria === 'FACHADA') && fotos.some((f) => f.categoria === 'PISO_VENTAS');

        this.sesion.iniciar({
          visitaId: visita.id,
          clienteNombre: visita.clienteNombre,
          erpClienteId: visita.erpClienteId,
          region: visita.region,
          planId: visita.planId,
          esProspecto: prospectos.length > 0 && !evidenciaCompleta,
          objetivoTipoNombre: plan?.objetivoTipoNombre,
          objetivoSubtipoNombre: plan?.objetivoSubtipoNombre,
          productosAuditar: plan?.productosAuditar,
        });

        if (evidenciaCompleta) {
          this.sesion.marcarEvidenciaGeneralCompleta();
        }
        if (evento) {
          this.sesion.marcarEventoRegistrado();
        }
        auditorias.filter((a) => a.completa).forEach((a) => this.sesion.marcarMarcaCompletada(a.marcaId, a.marcaNombre));

        return { fotos };
      }),
    );
  }
}
