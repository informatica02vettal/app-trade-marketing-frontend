import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { PlanVisita, TipoVisita } from '../../../core/models/plan-visita.model';
import { Usuario } from '../../../core/models/usuario.model';
import { ClienteErp } from '../../../core/models/cliente.model';

const BADGE_CLASE: Record<string, string> = { EJECUTADA: 'ok', PENDIENTE: 'warn', REPROGRAMADA: 'bad' };

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

  readonly mercaderistas = signal<Usuario[]>([]);
  readonly plan = signal<PlanVisita[]>([]);
  readonly filtroUsuarioId = signal<number | null>(null);
  readonly filtroFecha = signal<string>('');
  readonly guardando = signal(false);
  readonly mostrarModal = signal(false);

  readonly resultadosCliente = signal<ClienteErp[]>([]);
  readonly buscandoCliente = signal(false);
  readonly clienteSeleccionado = signal<ClienteErp | null>(null);

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
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  onClienteNombreChange(valor: string): void {
    this.nuevo.clienteNombre = valor;
    this.clienteSeleccionado.set(null);
    this.nuevo.erpClienteId = '';

    const termino = valor.trim();
    if (termino.length < 2) {
      this.resultadosCliente.set([]);
      return;
    }

    this.buscandoCliente.set(true);
    this.clienteService.buscar(termino).subscribe({
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
    this.resultadosCliente.set([]);
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
