import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Usuario, UsuarioRequest } from '../../../core/models/usuario.model';
import { AsignacionCliente, ClienteLocal, SucursalLocal } from '../../../core/models/cliente.model';

function formularioVacio(): UsuarioRequest {
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
  readonly clientesLocales = signal<ClienteLocal[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  // ---- Alta / edición de mercaderista (mismo modal para ambos) ----
  readonly mostrarModalForm = signal(false);
  readonly usuarioEditando = signal<Usuario | null>(null);
  formulario: UsuarioRequest = formularioVacio();

  readonly guardarDeshabilitado = computed(
    () =>
      this.guardando() ||
      !this.formulario.nombre ||
      !this.formulario.email ||
      (!this.usuarioEditando() && !this.formulario.password),
  );

  // ---- Asignación de clientes ----
  readonly mostrarModalAsignar = signal(false);
  readonly mercaderistaSeleccionado = signal<Usuario | null>(null);
  readonly asignaciones = signal<AsignacionCliente[]>([]);
  readonly sedesPorCliente = signal<Record<string, SucursalLocal[]>>({});
  readonly busquedaCliente = signal('');

  readonly resultadosCliente = computed(() => {
    const termino = this.busquedaCliente().trim().toLowerCase();
    if (termino.length < 2) return [];
    return this.clientesLocales()
      .filter(
        (c) =>
          c.codigoCliente.toLowerCase().includes(termino) ||
          (c.nombreComercial ?? '').toLowerCase().includes(termino) ||
          (c.nombreFiscal ?? '').toLowerCase().includes(termino),
      )
      .slice(0, 20);
  });

  ngOnInit(): void {
    this.cargar();
    this.clienteService.listarLocales().subscribe((clientes) => this.clientesLocales.set(clientes));
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

  // ---- Alta / edición ----
  abrirModalNuevo(): void {
    this.usuarioEditando.set(null);
    this.formulario = formularioVacio();
    this.error.set(null);
    this.mostrarModalForm.set(true);
  }

  abrirModalEditar(m: Usuario): void {
    this.usuarioEditando.set(m);
    this.formulario = {
      nombre: m.nombre,
      email: m.email,
      password: '',
      region: m.region ?? '',
      ejecutivoAsociado: m.ejecutivoAsociado ?? '',
      rol: m.rol,
      activo: m.activo,
    };
    this.error.set(null);
    this.mostrarModalForm.set(true);
  }

  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
  }

  guardar(): void {
    if (this.guardarDeshabilitado()) return;

    const editando = this.usuarioEditando();
    const payload: UsuarioRequest = {
      nombre: this.formulario.nombre,
      email: this.formulario.email,
      region: this.formulario.region || undefined,
      ejecutivoAsociado: this.formulario.ejecutivoAsociado || undefined,
      rol: this.formulario.rol,
    };
    if (this.formulario.password) payload.password = this.formulario.password;

    this.guardando.set(true);
    this.error.set(null);
    const request$ = editando ? this.usuarioService.actualizar(editando.id, payload) : this.usuarioService.crear(payload);
    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalForm.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No fue posible guardar el mercaderista');
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
    this.cargarAsignaciones(m.id);
    this.mostrarModalAsignar.set(true);
  }

  cerrarModalAsignar(): void {
    this.mostrarModalAsignar.set(false);
  }

  cargarAsignaciones(usuarioId: number): void {
    this.clienteService.listarAsignaciones(usuarioId).subscribe((asignaciones) => {
      this.asignaciones.set(asignaciones);
      this.sedesPorCliente.set({});
      asignaciones.forEach((a) => {
        this.clienteService.listarSucursalesLocales(a.erpClienteId).subscribe((sedes) => {
          this.sedesPorCliente.update((mapa) => ({ ...mapa, [a.erpClienteId]: sedes }));
        });
      });
    });
  }

  asignarCliente(cliente: ClienteLocal): void {
    const mercaderista = this.mercaderistaSeleccionado();
    if (!mercaderista) return;

    this.clienteService
      .crearAsignacion({
        erpClienteId: cliente.codigoCliente,
        clienteNombre: cliente.nombreComercial ?? cliente.nombreFiscal ?? cliente.codigoCliente,
        usuarioId: mercaderista.id,
        region: cliente.estado ?? undefined,
      })
      .subscribe({
        next: () => {
          this.busquedaCliente.set('');
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
