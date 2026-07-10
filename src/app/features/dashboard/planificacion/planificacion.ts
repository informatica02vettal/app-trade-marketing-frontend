import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PlanVisita, TipoVisita } from '../../../core/models/plan-visita.model';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-planificacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './planificacion.html',
})
export class Planificacion implements OnInit {
  private readonly planVisitaService = inject(PlanVisitaService);
  private readonly usuarioService = inject(UsuarioService);

  readonly mercaderistas = signal<Usuario[]>([]);
  readonly plan = signal<PlanVisita[]>([]);
  readonly filtroUsuarioId = signal<number | null>(null);
  readonly filtroFecha = signal<string>('');
  readonly guardando = signal(false);

  nuevo = {
    clienteNombre: '',
    erpClienteId: '',
    usuarioId: null as number | null,
    region: '',
    fechaProgramada: '',
    horaProgramada: '',
    objetivo: '',
    tipoVisita: 'PLANIFICADA' as TipoVisita,
  };

  ngOnInit(): void {
    this.usuarioService.listar().subscribe((usuarios) => this.mercaderistas.set(usuarios.filter((u) => u.rol === 'MERCADERISTA')));
    this.cargarPlan();
  }

  cargarPlan(): void {
    this.planVisitaService
      .listar(this.filtroUsuarioId() ?? undefined, this.filtroFecha() || undefined)
      .subscribe((plan) => this.plan.set(plan));
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
          this.nuevo = {
            clienteNombre: '',
            erpClienteId: '',
            usuarioId: null,
            region: '',
            fechaProgramada: '',
            horaProgramada: '',
            objetivo: '',
            tipoVisita: 'PLANIFICADA',
          };
          this.cargarPlan();
        },
        error: () => this.guardando.set(false),
      });
  }
}
