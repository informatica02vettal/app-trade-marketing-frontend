import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ObjetivoVisitaService } from '../../../core/services/objetivo-visita.service';
import { EstadoPlanVisita, PlanVisita, TipoVisita } from '../../../core/models/plan-visita.model';
import { Usuario } from '../../../core/models/usuario.model';
import { AsignacionCliente, SucursalLocal } from '../../../core/models/cliente.model';
import { ObjetivoVisitaSubtipo, ObjetivoVisitaTipo } from '../../../core/models/objetivo-visita.model';
import { BADGE_BAD, BADGE_OK, BADGE_WARN } from '../../../shared/ui/dash/badge-classes';

const BADGE_CLASE: Record<string, string> = { EJECUTADA: BADGE_OK, PENDIENTE: BADGE_WARN, REPROGRAMADA: BADGE_BAD };

function nuevoFormulario() {
  return {
    clienteNombre: '',
    erpClienteId: '',
    sucursalId: null as number | null,
    usuarioId: null as number | null,
    region: '',
    fechaProgramada: '',
    horaProgramada: '',
    objetivoTipoId: null as number | null,
    objetivoSubtipoId: null as number | null,
    comentario: '',
    tipoVisita: 'PLANIFICADA' as TipoVisita,
  };
}

@Component({
  selector: 'app-planificacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './planificacion.html',
})
export class Planificacion implements OnInit {
  private readonly planVisitaService = inject(PlanVisitaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly clienteService = inject(ClienteService);
  private readonly objetivoVisitaService = inject(ObjetivoVisitaService);

  readonly badgeClase = BADGE_CLASE;

  readonly mercaderistas = signal<Usuario[]>([]);
  readonly plan = signal<PlanVisita[]>([]);
  readonly filtroUsuarioId = signal<number | null>(null);
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');
  readonly filtroEstado = signal<EstadoPlanVisita | ''>('');
  readonly guardando = signal(false);
  readonly mostrarModal = signal(false);
  readonly verificandoDuplicado = signal(false);
  readonly mostrarModalDuplicado = signal(false);

  // ---- Reprogramar visita desde el listado ----
  readonly mostrarModalReprogramar = signal(false);
  readonly visitaReprogramando = signal<PlanVisita | null>(null);
  readonly guardandoReprogramacion = signal(false);
  reprogramarForm = { fecha: '', hora: '' };

  // ---- Cliente: acotado a los clientes asignados al mercaderista elegido ----
  readonly clientesAsignados = signal<AsignacionCliente[]>([]);
  readonly cargandoClientesAsignados = signal(false);
  readonly busquedaCliente = signal('');
  readonly mostrarSugerenciasCliente = signal(false);
  readonly clienteSeleccionado = signal<AsignacionCliente | null>(null);

  readonly clientesAsignadosFiltrados = computed(() => {
    const termino = this.busquedaCliente().trim().toLowerCase();
    if (!termino) return this.clientesAsignados();
    return this.clientesAsignados().filter((c) => (c.clienteNombre ?? '').toLowerCase().includes(termino));
  });

  // ---- Sucursales del cliente seleccionado (opcional) ----
  readonly sucursalesCliente = signal<SucursalLocal[]>([]);
  readonly cargandoSucursales = signal(false);

  // ---- Objetivo de la visita: tipo (+ subtipo si aplica), desde catálogo gestionable ----
  readonly objetivoTipos = signal<ObjetivoVisitaTipo[]>([]);
  readonly objetivoSubtipos = signal<ObjetivoVisitaSubtipo[]>([]);
  readonly subtiposDisponibles = signal<ObjetivoVisitaSubtipo[]>([]);

  // ---- Búsqueda de mercaderista (lista ya cargada, sin llamada a API) ----
  readonly busquedaMercaderista = signal('');
  readonly mostrarSugerenciasMercaderista = signal(false);
  readonly mercaderistasFiltrados = computed(() => {
    const termino = this.busquedaMercaderista().trim().toLowerCase();
    if (!termino) return this.mercaderistas();
    return this.mercaderistas().filter((m) => m.nombre.toLowerCase().includes(termino));
  });

  readonly ejecutadas = computed(() => this.plan().filter((p) => p.estado === 'EJECUTADA').length);
  readonly pendientes = computed(() => this.plan().filter((p) => p.estado === 'PENDIENTE').length);
  readonly reprogramadas = computed(() => this.plan().filter((p) => p.estado === 'REPROGRAMADA').length);

  nuevo = nuevoFormulario();

  ngOnInit(): void {
    this.usuarioService.listar().subscribe((usuarios) => this.mercaderistas.set(usuarios.filter((u) => u.rol === 'MERCADERISTA')));
    this.objetivoVisitaService.listarTipos().subscribe((tipos) => this.objetivoTipos.set(tipos.filter((t) => t.activo)));
    this.objetivoVisitaService.listarSubtipos().subscribe((subtipos) => this.objetivoSubtipos.set(subtipos.filter((s) => s.activo)));
    this.cargarPlan();
  }

  cargarPlan(): void {
    this.planVisitaService
      .listar(
        this.filtroUsuarioId() ?? undefined,
        this.filtroFechaDesde() || undefined,
        this.filtroFechaHasta() || undefined,
        this.filtroEstado() || undefined,
      )
      .subscribe((plan) => this.plan.set(plan));
  }

  onFiltroUsuarioChange(valor: number | null): void {
    this.filtroUsuarioId.set(valor);
    this.cargarPlan();
  }

  onFiltroFechaDesdeChange(valor: string): void {
    this.filtroFechaDesde.set(valor);
    this.cargarPlan();
  }

  onFiltroFechaHastaChange(valor: string): void {
    this.filtroFechaHasta.set(valor);
    this.cargarPlan();
  }

  onFiltroEstadoChange(valor: string): void {
    this.filtroEstado.set(valor as EstadoPlanVisita | '');
    this.cargarPlan();
  }

  abrirModal(): void {
    this.nuevo = nuevoFormulario();
    this.busquedaMercaderista.set('');
    this.mostrarSugerenciasMercaderista.set(false);
    this.subtiposDisponibles.set([]);
    this.limpiarCliente();
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  // ---- Mercaderista ----
  onBusquedaMercaderistaChange(valor: string): void {
    this.busquedaMercaderista.set(valor);
    this.mostrarSugerenciasMercaderista.set(true);
    if (!valor.trim()) {
      this.nuevo.usuarioId = null;
      this.limpiarCliente();
    }
  }

  seleccionarMercaderista(m: Usuario): void {
    this.nuevo.usuarioId = m.id;
    this.busquedaMercaderista.set(m.nombre);
    this.mostrarSugerenciasMercaderista.set(false);
    this.limpiarCliente();

    this.cargandoClientesAsignados.set(true);
    this.clienteService.listarAsignaciones(m.id).subscribe({
      next: (asignaciones) => {
        this.clientesAsignados.set(asignaciones);
        this.cargandoClientesAsignados.set(false);
      },
      error: () => this.cargandoClientesAsignados.set(false),
    });
  }

  ocultarSugerenciasMercaderista(): void {
    setTimeout(() => this.mostrarSugerenciasMercaderista.set(false), 150);
  }

  // ---- Cliente ----
  onBusquedaClienteChange(valor: string): void {
    this.busquedaCliente.set(valor);
    this.mostrarSugerenciasCliente.set(true);
    this.clienteSeleccionado.set(null);
    this.nuevo.erpClienteId = '';
    this.nuevo.clienteNombre = '';
    this.nuevo.sucursalId = null;
    this.sucursalesCliente.set([]);
  }

  ocultarSugerenciasCliente(): void {
    setTimeout(() => this.mostrarSugerenciasCliente.set(false), 150);
  }

  seleccionarCliente(asignacion: AsignacionCliente): void {
    this.clienteSeleccionado.set(asignacion);
    this.nuevo.clienteNombre = asignacion.clienteNombre ?? '';
    this.nuevo.erpClienteId = asignacion.erpClienteId;
    this.nuevo.region = asignacion.region ?? '';
    this.busquedaCliente.set(asignacion.clienteNombre ?? '');
    this.mostrarSugerenciasCliente.set(false);

    this.nuevo.sucursalId = null;
    this.sucursalesCliente.set([]);
    this.cargandoSucursales.set(true);
    this.clienteService.listarSucursalesLocales(asignacion.erpClienteId).subscribe({
      next: (sedes) => {
        this.sucursalesCliente.set(sedes);
        this.cargandoSucursales.set(false);
      },
      error: () => this.cargandoSucursales.set(false),
    });
  }

  limpiarCliente(): void {
    this.busquedaCliente.set('');
    this.mostrarSugerenciasCliente.set(false);
    this.clientesAsignados.set([]);
    this.clienteSeleccionado.set(null);
    this.nuevo.clienteNombre = '';
    this.nuevo.erpClienteId = '';
    this.nuevo.sucursalId = null;
    this.sucursalesCliente.set([]);
  }

  // ---- Tipo de visita ----
  onTipoVisitaChange(valor: TipoVisita): void {
    this.nuevo.tipoVisita = valor;
    if (valor === 'NO_PLANIFICADA') {
      this.nuevo.objetivoTipoId = null;
      this.nuevo.objetivoSubtipoId = null;
      this.subtiposDisponibles.set([]);
    }
  }

  // ---- Objetivo de la visita ----
  onObjetivoTipoChange(tipoId: number | null): void {
    this.nuevo.objetivoTipoId = tipoId;
    this.nuevo.objetivoSubtipoId = null;
    this.subtiposDisponibles.set(tipoId ? this.objetivoSubtipos().filter((s) => s.tipoId === tipoId) : []);
  }

  formularioValido(): boolean {
    return !!this.nuevo.usuarioId && !!this.nuevo.clienteNombre && !!this.nuevo.fechaProgramada && !!this.nuevo.horaProgramada;
  }

  intentarCrear(): void {
    if (!this.formularioValido()) return;

    this.verificandoDuplicado.set(true);
    this.planVisitaService.listar(undefined, this.nuevo.fechaProgramada, this.nuevo.fechaProgramada).subscribe({
      next: (existentes) => {
        this.verificandoDuplicado.set(false);
        const yaExiste = existentes.some((p) =>
          this.nuevo.erpClienteId
            ? p.erpClienteId === this.nuevo.erpClienteId
            : p.clienteNombre.trim().toLowerCase() === this.nuevo.clienteNombre.trim().toLowerCase(),
        );
        if (yaExiste) {
          this.mostrarModalDuplicado.set(true);
        } else {
          this.crear();
        }
      },
      error: () => {
        this.verificandoDuplicado.set(false);
        this.crear();
      },
    });
  }

  confirmarDuplicadoYCrear(): void {
    this.mostrarModalDuplicado.set(false);
    this.crear();
  }

  cancelarDuplicado(): void {
    this.mostrarModalDuplicado.set(false);
  }

  crear(): void {
    if (!this.formularioValido()) return;

    this.guardando.set(true);
    this.planVisitaService
      .crear({
        clienteNombre: this.nuevo.clienteNombre,
        erpClienteId: this.nuevo.erpClienteId || undefined,
        sucursalId: this.nuevo.sucursalId ?? undefined,
        usuarioId: this.nuevo.usuarioId ?? undefined,
        region: this.nuevo.region || undefined,
        fechaProgramada: this.nuevo.fechaProgramada,
        horaProgramada: this.nuevo.horaProgramada,
        objetivoTipoId: this.nuevo.objetivoTipoId ?? undefined,
        objetivoSubtipoId: this.nuevo.objetivoSubtipoId ?? undefined,
        comentario: this.nuevo.comentario || undefined,
        tipoVisita: this.nuevo.tipoVisita,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModal.set(false);
          this.cargarPlan();
        },
        error: () => this.guardando.set(false),
      });
  }

  // ---- Reprogramar ----
  abrirReprogramar(p: PlanVisita): void {
    this.visitaReprogramando.set(p);
    this.reprogramarForm = { fecha: p.fechaProgramada, hora: p.horaProgramada ?? '' };
    this.mostrarModalReprogramar.set(true);
  }

  cerrarReprogramar(): void {
    this.mostrarModalReprogramar.set(false);
  }

  guardarReprogramacion(): void {
    const visita = this.visitaReprogramando();
    if (!visita || !this.reprogramarForm.fecha || !this.reprogramarForm.hora) return;

    this.guardandoReprogramacion.set(true);
    this.planVisitaService
      .reprogramar(visita.id, { fechaProgramada: this.reprogramarForm.fecha, horaProgramada: this.reprogramarForm.hora })
      .subscribe({
        next: () => {
          this.guardandoReprogramacion.set(false);
          this.mostrarModalReprogramar.set(false);
          this.cargarPlan();
        },
        error: () => this.guardandoReprogramacion.set(false),
      });
  }
}
