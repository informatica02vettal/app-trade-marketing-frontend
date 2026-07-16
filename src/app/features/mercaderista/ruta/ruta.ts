import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { VisitaService } from '../../../core/services/visita.service';
import { VisitaSessionService } from '../../../core/session/visita-session.service';
import { VisitaReconstruccionService } from '../../../core/session/visita-reconstruccion.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClienteErp } from '../../../core/models/cliente.model';
import { PlanVisita } from '../../../core/models/plan-visita.model';
import { ProductoResumen } from '../../../core/models/producto.model';
import { Visita, VisitaCheckinRequest } from '../../../core/models/visita.model';
import { mensajeGpsError, obtenerGpsConDiagnostico } from '../../../core/utils/gps.util';

// Date.toISOString() convierte a UTC, no a la hora local del dispositivo:
// pasadas las 8pm (Venezuela, UTC-4) ya cae en el día siguiente y "hoy"
// termina siendo mañana, dejando fuera del plan las visitas del día real.
function fechaLocalISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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
  private readonly visitaSession = inject(VisitaSessionService);
  private readonly visitaReconstruccion = inject(VisitaReconstruccionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuarioActual;
  readonly plan = signal<PlanVisita[]>([]);
  readonly cargandoPlan = signal(false);
  readonly iniciandoVisita = signal(false);

  readonly busqueda = signal('');
  readonly resultadosBusqueda = signal<ClienteErp[]>([]);
  readonly mostrarBusqueda = signal(false);
  readonly mostrarProspecto = signal(false);

  readonly planificadas = computed(() => this.plan().length);
  readonly ejecutadas = computed(() => this.plan().filter((p) => p.estado === 'EJECUTADA').length);
  readonly cumplimientoPct = computed(() => {
    const total = this.planificadas();
    return total > 0 ? Math.round((this.ejecutadas() / total) * 100) : 0;
  });

  readonly fechaHoyLabel = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short' }).format(new Date());

  ngOnInit(): void {
    this.cargarPlanDelDia();
  }

  cargarPlanDelDia(): void {
    const usuario = this.usuario();
    if (!usuario) return;
    this.cargandoPlan.set(true);
    const hoy = fechaLocalISO(new Date());
    this.planVisitaService.listar(usuario.id, hoy, hoy).subscribe({
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
    this.continuarOIniciar(
      (v) => v.planId === p.id,
      () =>
        this.iniciarCheckin({
          planId: p.id,
          erpClienteId: p.erpClienteId ?? undefined,
          clienteNombre: p.clienteNombre,
          region: p.region ?? undefined,
          objetivoTipoNombre: p.objetivoTipoNombre,
          objetivoSubtipoNombre: p.objetivoSubtipoNombre,
          productosAuditar: p.productosAuditar,
        }),
    );
  }

  iniciarVisitaCliente(cliente: ClienteErp): void {
    this.mostrarBusqueda.set(false);
    this.continuarOIniciar(
      (v) => v.erpClienteId === cliente.id,
      () => this.iniciarCheckin({ erpClienteId: cliente.id, clienteNombre: cliente.nombre }),
    );
  }

  iniciarClienteProspecto(): void {
    this.mostrarProspecto.set(false);
    this.iniciarCheckin({ clienteNombre: 'Cliente prospecto' }, true);
  }

  // Antes de iniciar una visita nueva, revisa si esta misma (mismo plan o
  // mismo cliente) ya quedó EN_CURSO sin cerrar — de ser así, la retoma
  // reconstruyendo el progreso desde el backend en vez de duplicarla.
  private continuarOIniciar(coincide: (v: Visita) => boolean, iniciarNueva: () => void): void {
    const usuario = this.usuario();
    if (!usuario || this.iniciandoVisita()) return;

    this.iniciandoVisita.set(true);
    this.visitaService.listar(usuario.id).subscribe({
      next: (visitas) => {
        const enCurso = visitas.find((v) => v.estado === 'EN_CURSO' && coincide(v));
        if (!enCurso) {
          this.iniciandoVisita.set(false);
          iniciarNueva();
          return;
        }

        this.visitaReconstruccion.reconstruir(enCurso).subscribe(() => {
          this.iniciandoVisita.set(false);
          this.router.navigate(['/app/visita', enCurso.id]);
        });
      },
      error: () => {
        this.iniciandoVisita.set(false);
        iniciarNueva();
      },
    });
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
    obtenerGpsConDiagnostico().then(({ coords, error }) => {
      // No se bloquea el check-in por falta de GPS (el mercaderista igual
      // debe poder registrar la visita), pero si falló se le avisa por qué,
      // en vez de guardar la visita sin ubicación y sin ninguna explicación.
      if (error) {
        this.toastService.mostrar(mensajeGpsError(error), 'info');
      }

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
