import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Region, RegionRequest } from '../../../core/models/catalogo.model';

function formularioVacio(): RegionRequest {
  return { nombre: '', detalles: '' };
}

@Component({
  selector: 'app-regiones',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './regiones.html',
})
export class Regiones implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly regiones = signal<Region[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');

  readonly mostrarModal = signal(false);
  readonly regionEditando = signal<Region | null>(null);
  formulario: RegionRequest = formularioVacio();

  readonly regionesFiltradas = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return this.regiones();
    return this.regiones().filter(
      (r) => r.nombre.toLowerCase().includes(termino) || (r.detalles ?? '').toLowerCase().includes(termino),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.catalogoService.listarRegiones().subscribe({
      next: (regiones) => {
        this.regiones.set(regiones);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirModalNuevo(): void {
    this.regionEditando.set(null);
    this.formulario = formularioVacio();
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalEditar(r: Region): void {
    this.regionEditando.set(r);
    this.formulario = { nombre: r.nombre, detalles: r.detalles ?? '' };
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardarDeshabilitado(): boolean {
    return this.guardando() || !this.formulario.nombre.trim();
  }

  guardar(): void {
    if (this.guardarDeshabilitado()) return;

    const editando = this.regionEditando();
    const payload: RegionRequest = {
      nombre: this.formulario.nombre.trim(),
      detalles: this.formulario.detalles?.trim() || undefined,
    };

    this.guardando.set(true);
    this.error.set(null);
    const request$ = editando
      ? this.catalogoService.actualizarRegion(editando.id, payload)
      : this.catalogoService.crearRegion(payload);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No fue posible guardar la región');
        this.guardando.set(false);
      },
    });
  }

  desactivar(r: Region): void {
    this.error.set(null);
    this.catalogoService.cambiarEstadoRegion(r.id, false).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message || 'No fue posible desactivar la región'),
    });
  }

  reactivar(r: Region): void {
    this.error.set(null);
    this.catalogoService.cambiarEstadoRegion(r.id, true).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message || 'No fue posible reactivar la región'),
    });
  }
}
