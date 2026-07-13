import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteLocal, SincronizacionResultado } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './clientes.html',
})
export class Clientes implements OnInit {
  private readonly clienteService = inject(ClienteService);

  readonly clientes = signal<ClienteLocal[]>([]);
  readonly busqueda = signal('');
  readonly sincronizando = signal(false);
  readonly cargando = signal(false);
  readonly ultimaSincronizacion = signal<SincronizacionResultado | null>(null);
  readonly error = signal<string | null>(null);

  readonly clientesFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.clientes();
    return this.clientes().filter(
      (c) =>
        c.codigoCliente.toLowerCase().includes(termino) ||
        (c.nombreComercial ?? '').toLowerCase().includes(termino) ||
        (c.nombreFiscal ?? '').toLowerCase().includes(termino) ||
        (c.rif ?? '').toLowerCase().includes(termino),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.clienteService.listarLocales().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  sincronizar(): void {
    this.sincronizando.set(true);
    this.error.set(null);
    this.clienteService.sincronizar().subscribe({
      next: (resultado) => {
        this.ultimaSincronizacion.set(resultado);
        this.sincronizando.set(false);
        this.cargar();
      },
      error: () => {
        this.error.set('No fue posible sincronizar con el ERP. Intenta de nuevo.');
        this.sincronizando.set(false);
      },
    });
  }
}
