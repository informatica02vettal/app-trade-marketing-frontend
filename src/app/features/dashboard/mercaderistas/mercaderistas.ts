import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Usuario, UsuarioRequest } from '../../../core/models/usuario.model';
import { AsignacionCliente, ClienteErp } from '../../../core/models/cliente.model';

function nuevoFormulario(): UsuarioRequest {
  return { nombre: '', email: '', password: '', region: '', ejecutivoAsociado: '', rol: 'MERCADERISTA' };
}

@Component({
  selector: 'app-mercaderistas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mercaderistas.html',
})
export class Mercaderistas implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly clienteService = inject(ClienteService);

  readonly mercaderistas = signal<Usuario[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly mostrarModalNuevo = signal(false);
  nuevo = nuevoFormulario();

  readonly mostrarModalAsignar = signal(false);
  readonly mercaderistaSeleccionado = signal<Usuario | null>(null);
  readonly asignaciones = signal<AsignacionCliente[]>([]);
  readonly busquedaCliente = signal('');
  readonly resultadosCliente = signal<ClienteErp[]>([]);
  readonly buscandoCliente = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.mercaderistas.set(usuarios.filter((u) => u.rol === 'MERCADERISTA'));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // ---- Alta de mercaderista ----
  abrirModalNuevo(): void {
    this.nuevo = nuevoFormulario();
    this.error.set(null);
    this.mostrarModalNuevo.set(true);
  }

  cerrarModalNuevo(): void {
    this.mostrarModalNuevo.set(false);
  }

  crear(): void {
    if (!this.nuevo.nombre || !this.nuevo.email || !this.nuevo.password) return;

    this.guardando.set(true);
    this.error.set(null);
    this.usuarioService.crear(this.nuevo).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalNuevo.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No fue posible crear el mercaderista');
        this.guardando.set(false);
      },
    });
  }

  desactivar(m: Usuario): void {
    this.usuarioService.eliminar(m.id).subscribe(() => this.cargar());
  }

  reactivar(m: Usuario): void {
    this.usuarioService
      .actualizar(m.id, {
        nombre: m.nombre,
        email: m.email,
        region: m.region ?? undefined,
        ejecutivoAsociado: m.ejecutivoAsociado ?? undefined,
        rol: m.rol,
        activo: true,
      })
      .subscribe(() => this.cargar());
  }

  // ---- Asignación de clientes ----
  abrirAsignaciones(m: Usuario): void {
    this.mercaderistaSeleccionado.set(m);
    this.busquedaCliente.set('');
    this.resultadosCliente.set([]);
    this.cargarAsignaciones(m.id);
    this.mostrarModalAsignar.set(true);
  }

  cerrarModalAsignar(): void {
    this.mostrarModalAsignar.set(false);
  }

  cargarAsignaciones(usuarioId: number): void {
    this.clienteService.listarAsignaciones(usuarioId).subscribe((asignaciones) => this.asignaciones.set(asignaciones));
  }

  onBusquedaClienteChange(valor: string): void {
    this.busquedaCliente.set(valor);
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

  asignarCliente(cliente: ClienteErp): void {
    const mercaderista = this.mercaderistaSeleccionado();
    if (!mercaderista) return;

    this.clienteService
      .crearAsignacion({ erpClienteId: cliente.id, clienteNombre: cliente.nombre, usuarioId: mercaderista.id })
      .subscribe({
        next: () => {
          this.busquedaCliente.set('');
          this.resultadosCliente.set([]);
          this.cargarAsignaciones(mercaderista.id);
          this.cargar();
        },
        error: (err) => this.error.set(err?.error?.message || 'No fue posible asignar el cliente'),
      });
  }

  quitarAsignacion(a: AsignacionCliente): void {
    const mercaderista = this.mercaderistaSeleccionado();
    if (!mercaderista) return;

    this.clienteService.eliminarAsignacion(a.id).subscribe(() => {
      this.cargarAsignaciones(mercaderista.id);
      this.cargar();
    });
  }
}
