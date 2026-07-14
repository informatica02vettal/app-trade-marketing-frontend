import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { VisitaService } from '../../../core/services/visita.service';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { EventoService } from '../../../core/services/evento.service';
import { VisitaSessionService } from '../../../core/session/visita-session.service';
import { ClienteErp } from '../../../core/models/cliente.model';
import { PlanVisita } from '../../../core/models/plan-visita.model';
import { ProductoResumen } from '../../../core/models/producto.model';
import { Visita, VisitaCheckinRequest } from '../../../core/models/visita.model';

function obtenerGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ruta.html',
})
export class Ruta implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly planVisitaService = inject(PlanVisitaService);
  private readonly clienteService = inject(ClienteService);
  private readonly visitaService = inject(VisitaService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly eventoService = inject(EventoService);
  private readonly visitaSession = inject(VisitaSessionService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuarioActual;
  readonly plan = signal<PlanVisita[]>([]);
  readonly cargandoPlan = signal(false);
  readonly iniciandoVisita = signal(false);

  readonly busqueda = signal('');
  readonly resultadosBusqueda = signal<ClienteErp[]>([]);
  readonly mostrarBusqueda = signal(false);
  readonly mostrarProspecto = signal(false);

  // Visita EN_CURSO en el backend que el estado local (localStorage) no
  // conoce — puede pasar si se borró el almacenamiento del navegador o se
  // usa otro dispositivo/sesión. Se ofrece continuarla en vez de perderla.
  readonly visitaEnCursoRecuperable = signal<Visita | null>(null);
  readonly recuperandoVisita = signal(false);

  readonly planificadas = computed(() => this.plan().length);
  readonly ejecutadas = computed(() => this.plan().filter((p) => p.estado === 'EJECUTADA').length);
  readonly cumplimientoPct = computed(() => {
    const total = this.planificadas();
    return total > 0 ? Math.round((this.ejecutadas() / total) * 100) : 0;
  });

  readonly fechaHoyLabel = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short' }).format(new Date());

  ngOnInit(): void {
    this.cargarPlanDelDia();
    this.verificarVisitaEnCursoEnBackend();
  }

  private verificarVisitaEnCursoEnBackend(): void {
    const usuario = this.usuario();
    if (!usuario || this.visitaSession.hayVisitaActiva) return;

    this.visitaService.listar(usuario.id).subscribe((visitas) => {
      const enCurso = visitas.find((v) => v.estado === 'EN_CURSO');
      this.visitaEnCursoRecuperable.set(enCurso ?? null);
    });
  }

  continuarVisitaEnCurso(): void {
    const visita = this.visitaEnCursoRecuperable();
    if (!visita || this.recuperandoVisita()) return;

    this.recuperandoVisita.set(true);
    forkJoin({
      fotos: this.visitaService.listarFotos(visita.id),
      auditorias: this.auditoriaService.listarPorVisita(visita.id),
      evento: this.eventoService.obtenerPorVisita(visita.id),
      prospectos: this.visitaService.listarClientesProspecto(visita.id),
    }).subscribe(({ fotos, auditorias, evento, prospectos }) => {
      const plan = visita.planId ? this.plan().find((p) => p.id === visita.planId) : undefined;
      const evidenciaCompleta =
        fotos.some((f) => f.categoria === 'FACHADA') && fotos.some((f) => f.categoria === 'PISO_VENTAS');

      this.visitaSession.iniciar({
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
        this.visitaSession.marcarEvidenciaGeneralCompleta();
      }
      if (evento) {
        this.visitaSession.marcarEventoRegistrado();
      }
      auditorias.forEach((a) => this.visitaSession.marcarMarcaCompletada(a.marcaId, a.marcaNombre));

      this.recuperandoVisita.set(false);
      this.visitaEnCursoRecuperable.set(null);
      this.router.navigate(['/app/visita', visita.id]);
    });
  }

  cargarPlanDelDia(): void {
    const usuario = this.usuario();
    if (!usuario) return;
    this.cargandoPlan.set(true);
    const hoy = new Date().toISOString().slice(0, 10);
    this.planVisitaService.listar(usuario.id, hoy).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.cargandoPlan.set(false);
      },
      error: () => this.cargandoPlan.set(false),
    });
  }

  buscarCliente(): void {
    const termino = this.busqueda().trim();
    if (termino.length < 2) {
      this.resultadosBusqueda.set([]);
      return;
    }
    this.clienteService.buscar(termino).subscribe((resultados) => this.resultadosBusqueda.set(resultados));
  }

  iniciarVisitaPlanificada(p: PlanVisita): void {
    this.iniciarCheckin({
      planId: p.id,
      erpClienteId: p.erpClienteId ?? undefined,
      clienteNombre: p.clienteNombre,
      region: p.region ?? undefined,
      objetivoTipoNombre: p.objetivoTipoNombre,
      objetivoSubtipoNombre: p.objetivoSubtipoNombre,
      productosAuditar: p.productosAuditar,
    });
  }

  iniciarVisitaCliente(cliente: ClienteErp): void {
    this.mostrarBusqueda.set(false);
    this.iniciarCheckin({ erpClienteId: cliente.id, clienteNombre: cliente.nombre });
  }

  iniciarClienteProspecto(): void {
    this.mostrarProspecto.set(false);
    this.iniciarCheckin({ clienteNombre: 'Cliente prospecto' }, true);
  }

  private iniciarCheckin(
    datos: {
      planId?: number;
      erpClienteId?: string;
      clienteNombre: string;
      region?: string;
      objetivoTipoNombre?: string | null;
      objetivoSubtipoNombre?: string | null;
      productosAuditar?: ProductoResumen[];
    },
    esProspecto = false,
  ): void {
    const usuario = this.usuario();
    if (!usuario || this.iniciandoVisita()) return;

    this.iniciandoVisita.set(true);
    obtenerGps().then((coords) => {
      const request: VisitaCheckinRequest = {
        planId: datos.planId,
        erpClienteId: datos.erpClienteId,
        clienteNombre: datos.clienteNombre,
        region: datos.region ?? usuario.region ?? undefined,
        checkinGpsLat: coords?.lat,
        checkinGpsLng: coords?.lng,
      };

      this.visitaService.checkin(request).subscribe({
        next: (visita) => {
          this.visitaSession.iniciar({
            visitaId: visita.id,
            clienteNombre: visita.clienteNombre,
            erpClienteId: visita.erpClienteId,
            region: visita.region,
            planId: visita.planId,
            esProspecto,
            objetivoTipoNombre: datos.objetivoTipoNombre,
            objetivoSubtipoNombre: datos.objetivoSubtipoNombre,
            productosAuditar: datos.productosAuditar,
          });
          this.iniciandoVisita.set(false);
          this.router.navigate(['/app/visita', visita.id]);
        },
        error: () => this.iniciandoVisita.set(false),
      });
    });
  }
}
