import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoLocal, SincronizacionProductosResultado } from '../../../core/models/producto.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private readonly productoService = inject(ProductoService);

  readonly productos = signal<ProductoLocal[]>([]);
  readonly busqueda = signal('');
  readonly sincronizando = signal(false);
  readonly cargando = signal(false);
  readonly ultimaSincronizacion = signal<SincronizacionProductosResultado | null>(null);
  readonly error = signal<string | null>(null);

  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.productos();
    return this.productos().filter(
      (p) =>
        p.codigo.toLowerCase().includes(termino) ||
        (p.producto ?? '').toLowerCase().includes(termino) ||
        (p.nombreComercial ?? '').toLowerCase().includes(termino) ||
        (p.marca ?? '').toLowerCase().includes(termino),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  sincronizar(): void {
    this.sincronizando.set(true);
    this.error.set(null);
    this.productoService.sincronizar().subscribe({
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
