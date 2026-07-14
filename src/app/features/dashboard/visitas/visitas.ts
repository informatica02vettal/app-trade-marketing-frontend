import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { VisitaService } from '../../../core/services/visita.service';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { MercadoService } from '../../../core/services/mercado.service';
import { EventoService } from '../../../core/services/evento.service';
import { CompetidorService } from '../../../core/services/competidor.service';
import { ArchivoUploadService } from '../../../core/services/archivo-upload.service';
import { ClienteProspecto, EvidenciaFoto, Visita } from '../../../core/models/visita.model';
import { AuditoriaMarca } from '../../../core/models/auditoria.model';
import { Solicitud } from '../../../core/models/solicitud.model';
import { HallazgoMercado } from '../../../core/models/mercado.model';
import { EventoVisita, MotivoEvento } from '../../../core/models/evento.model';
import { Competidor } from '../../../core/models/competidor.model';
import { BADGE_INFO, BADGE_NEUTRAL, BADGE_OK } from '../../../shared/ui/dash/badge-classes';

const BADGE_CLASE: Record<string, string> = { COMPLETADA: BADGE_OK, EN_CURSO: BADGE_INFO };

const MOTIVOS_EVENTO: Record<MotivoEvento, string> = {
  ANIVERSARIO_CLIENTE: 'Aniversario del cliente',
  IMPULSO_MARCA: 'Impulso de marca',
  APERTURA_TIENDA: 'Apertura de tienda',
  ROTACION_PRODUCTOS: 'Rotación de productos',
  OTRO: 'Otro',
};

const AMENIDADES_COMPETIDOR: { campo: keyof Competidor; label: string }[] = [
  { campo: 'poseeInflables', label: 'Inflables' },
  { campo: 'poseeToldos', label: 'Toldos' },
  { campo: 'poseePantallaLed', label: 'Pantalla LED' },
  { campo: 'poseeExperienciasInteractivas', label: 'Experiencias interactivas' },
  { campo: 'realizaDemostraciones', label: 'Demostraciones' },
  { campo: 'entregaMaterialPop', label: 'Entrega material POP' },
  { campo: 'entregaMuestras', label: 'Entrega muestras' },
  { campo: 'realizaRifasConcursos', label: 'Rifas o concursos' },
  { campo: 'realizaPromocionesEspeciales', label: 'Promociones especiales' },
  { campo: 'cuentaActivaciones', label: 'Activaciones' },
  { campo: 'poseeExhibidoresDiferenciadores', label: 'Exhibidores diferenciadores' },
  { campo: 'utilizaMascotasPublicitarias', label: 'Mascotas publicitarias' },
];

@Component({
  selector: 'app-visitas',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './visitas.html',
})
export class Visitas implements OnInit {
  private readonly visitaService = inject(VisitaService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly mercadoService = inject(MercadoService);
  private readonly eventoService = inject(EventoService);
  private readonly competidorService = inject(CompetidorService);
  readonly archivoUploadService = inject(ArchivoUploadService);

  readonly badgeClase = BADGE_CLASE;
  readonly badgeNeutral = BADGE_NEUTRAL;
  readonly motivosEvento = MOTIVOS_EVENTO;
  readonly amenidadesCompetidorDef = AMENIDADES_COMPETIDOR;
  readonly visitas = signal<Visita[]>([]);

  // ---- Detalle de visita ----
  readonly mostrarDetalle = signal(false);
  readonly visitaSeleccionada = signal<Visita | null>(null);
  readonly cargandoDetalle = signal(false);
  readonly fotosGenerales = signal<EvidenciaFoto[]>([]);
  readonly auditorias = signal<AuditoriaMarca[]>([]);
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly hallazgosMercado = signal<HallazgoMercado[]>([]);
  readonly evento = signal<EventoVisita | null>(null);
  readonly competidores = signal<Competidor[]>([]);
  readonly prospectos = signal<ClienteProspecto[]>([]);

  ngOnInit(): void {
    this.visitaService.listar().subscribe((visitas) => this.visitas.set(visitas));
  }

  abrirDetalle(visita: Visita): void {
    this.visitaSeleccionada.set(visita);
    this.mostrarDetalle.set(true);
    this.cargandoDetalle.set(true);
    this.fotosGenerales.set([]);
    this.auditorias.set([]);
    this.solicitudes.set([]);
    this.hallazgosMercado.set([]);
    this.evento.set(null);
    this.competidores.set([]);
    this.prospectos.set([]);

    const visitaId = visita.id;
    let pendientes = 7;
    const listo = () => {
      pendientes -= 1;
      if (pendientes === 0) this.cargandoDetalle.set(false);
    };

    this.visitaService.listarFotos(visitaId).subscribe({
      next: (f) => {
        this.fotosGenerales.set(f);
        listo();
      },
      error: listo,
    });
    this.auditoriaService.listarPorVisita(visitaId).subscribe({
      next: (a) => {
        this.auditorias.set(a);
        listo();
      },
      error: listo,
    });
    this.solicitudService.listar(undefined, undefined, visitaId).subscribe({
      next: (s) => {
        this.solicitudes.set(s);
        listo();
      },
      error: listo,
    });
    this.mercadoService.listar({ visitaId }).subscribe({
      next: (m) => {
        this.hallazgosMercado.set(m);
        listo();
      },
      error: listo,
    });
    this.eventoService.obtenerPorVisita(visitaId).subscribe({
      next: (e) => {
        this.evento.set(e);
        listo();
      },
      error: listo,
    });
    this.competidorService.listarPorVisita(visitaId).subscribe({
      next: (c) => {
        this.competidores.set(c);
        listo();
      },
      error: listo,
    });
    this.visitaService.listarClientesProspecto(visitaId).subscribe({
      next: (p) => {
        this.prospectos.set(p);
        listo();
      },
      error: listo,
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
  }

  checklistAuditoria(a: AuditoriaMarca): { label: string; valor: boolean }[] {
    return [
      { label: 'Exhibidor propio', valor: a.exhibidorMarca },
      { label: 'Producto en exhibidor', valor: a.productoExhibidor },
      { label: 'Producto en anaquel', valor: a.productoAnaquel },
      { label: 'Aviso de fachada', valor: a.avisoFachada },
      { label: 'Aviso de pared', valor: a.avisoPared },
      { label: 'Banderines', valor: a.banderines },
      { label: 'Rotulado', valor: a.rotulado },
      { label: 'Empleados uniformados', valor: a.empleadosUniforme },
    ];
  }

  amenidadesActivas(c: Competidor): string[] {
    return AMENIDADES_COMPETIDOR.filter((a) => !!c[a.campo]).map((a) => a.label);
  }
}
