import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PlanVisita, TipoVisita } from '../../../core/models/plan-visita.model';
import { Usuario } from '../../../core/models/usuario.model';
import { ClienteErp } from '../../../core/models/cliente.model';
import { BADGE_BAD, BADGE_OK, BADGE_WARN } from '../../../shared/ui/dash/badge-classes';
import { PILL, PILL_SELECTED } from '../../../shared/ui/dash/field-classes';

const BADGE_CLASE: Record<string, string> = { EJECUTADA: BADGE_OK, PENDIENTE: BADGE_WARN, REPROGRAMADA: BADGE_BAD };

type ModoBusquedaCliente = 'nombre' | 'id';

function rangoSemana(): string {
  const hoy = new Date();
  const lunes = new Date(hoy);
  const dia = (hoy.getDay() + 6) % 7;
  lunes.setDate(hoy.getDate() - dia);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short' });
  return `Semana del ${fmt.format(lunes)} — ${fmt.format(domingo)}`;
}

function nuevoFormulario() {
  return {
    clienteNombre: '',
    erpClienteId: '',
    usuarioId: null as number | null,
    region: '',
    fechaProgramada: '',
    horaProgramada: '',
    objetivo: '',
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

  readonly badgeClase = BADGE_CLASE;
  readonly rangoSemana = rangoSemana();

  claseModo(modo: ModoBusquedaCliente): string {
    return modo === this.modoBusquedaCliente() ? `${PILL} ${PILL_SELECTED}` : PILL;
  }

  readonly mercaderistas = signal<Usuario[]>([]);
  readonly plan = signal<PlanVisita[]>([]);
  readonly filtroUsuarioId = signal<number | null>(null);
  readonly filtroFecha = signal<string>('');
  readonly guardando = signal(false);
  readonly mostrarModal = signal(false);

  // ---- Búsqueda de cliente (ERP) ----
  readonly modoBusquedaCliente = signal<ModoBusquedaCliente>('nombre');
  readonly busquedaCliente = signal('');
  readonly resultadosCliente = signal<ClienteErp[]>([]);
  readonly buscandoCliente = signal(false);
  readonly clienteSeleccionado = signal<ClienteErp | null>(null);

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
    this.cargarPlan();
  }

  cargarPlan(): void {
    this.planVisitaService
      .listar(this.filtroUsuarioId() ?? undefined, this.filtroFecha() || undefined)
      .subscribe((plan) => this.plan.set(plan));
  }

  abrirModal(): void {
    this.nuevo = nuevoFormulario();
    this.clienteSeleccionado.set(null);
    this.resultadosCliente.set([]);
    this.busquedaCliente.set('');
    this.modoBusquedaCliente.set('nombre');
    this.busquedaMercaderista.set('');
    this.mostrarSugerenciasMercaderista.set(false);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  // ---- Cliente ----
  cambiarModoBusquedaCliente(modo: ModoBusquedaCliente): void {
    if (this.modoBusquedaCliente() === modo) return;
    this.modoBusquedaCliente.set(modo);
    this.limpiarBusquedaCliente();
  }

  onBusquedaClienteChange(valor: string): void {
    this.busquedaCliente.set(valor);
    this.clienteSeleccionado.set(null);
    this.nuevo.erpClienteId = '';
    if (this.modoBusquedaCliente() === 'nombre') {
      this.nuevo.clienteNombre = valor;
    }

    const termino = valor.trim();
    if (termino.length < 2) {
      this.resultadosCliente.set([]);
      return;
    }

    this.buscandoCliente.set(true);
    const busqueda =
      this.modoBusquedaCliente() === 'id' ? this.clienteService.buscar(undefined, termino) : this.clienteService.buscar(termino);
    busqueda.subscribe({
      next: (resultados) => {
        this.resultadosCliente.set(resultados);
        this.buscandoCliente.set(false);
      },
      error: () => this.buscandoCliente.set(false),
    });
  }

  seleccionarCliente(cliente: ClienteErp): void {
    this.clienteSeleccionado.set(cliente);
    this.nuevo.clienteNombre = cliente.nombre;
    this.nuevo.erpClienteId = cliente.id;
    this.busquedaCliente.set(cliente.nombre);
    this.resultadosCliente.set([]);
  }

  limpiarBusquedaCliente(): void {
    this.busquedaCliente.set('');
    this.resultadosCliente.set([]);
    this.clienteSeleccionado.set(null);
    this.nuevo.clienteNombre = '';
    this.nuevo.erpClienteId = '';
  }

  // ---- Mercaderista ----
  onBusquedaMercaderistaChange(valor: string): void {
    this.busquedaMercaderista.set(valor);
    this.mostrarSugerenciasMercaderista.set(true);
    if (!valor.trim()) {
      this.nuevo.usuarioId = null;
    }
  }

  seleccionarMercaderista(m: Usuario): void {
    this.nuevo.usuarioId = m.id;
    this.busquedaMercaderista.set(m.nombre);
    this.mostrarSugerenciasMercaderista.set(false);
  }

  ocultarSugerenciasMercaderista(): void {
    setTimeout(() => this.mostrarSugerenciasMercaderista.set(false), 150);
  }

  crear(): void {
    if (!this.nuevo.clienteNombre || !this.nuevo.fechaProgramada) return;

    this.guardando.set(true);
    this.planVisitaService
      .crear({
        clienteNombre: this.nuevo.clienteNombre,
        erpClienteId: this.nuevo.erpClienteId || undefined,
        usuarioId: this.nuevo.usuarioId ?? undefined,
        region: this.nuevo.region || undefined,
        fechaProgramada: this.nuevo.fechaProgramada,
        horaProgramada: this.nuevo.horaProgramada || undefined,
        objetivo: this.nuevo.objetivo || undefined,
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

  marcarEjecutada(p: PlanVisita): void {
    this.planVisitaService.cambiarEstado(p.id, 'EJECUTADA').subscribe(() => this.cargarPlan());
  }
}
