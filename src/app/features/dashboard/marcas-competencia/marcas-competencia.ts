import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Marca, MarcaCompetencia } from '../../../core/models/catalogo.model';

@Component({
  selector: 'app-marcas-competencia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './marcas-competencia.html',
})
export class MarcasCompetencia implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly marcas = signal<Marca[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // ---- Gestión de competencia de una marca ----
  readonly mostrarModal = signal(false);
  readonly marcaSeleccionada = signal<Marca | null>(null);
  readonly competencia = signal<MarcaCompetencia[]>([]);
  readonly guardando = signal(false);
  nuevoNombre = '';
  competenciaEditandoId: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.catalogoService.listarMarcas().subscribe({
      next: (marcas) => {
        this.marcas.set(marcas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCompetencia(m: Marca): void {
    this.marcaSeleccionada.set(m);
    this.nuevoNombre = '';
    this.competenciaEditandoId = null;
    this.error.set(null);
    this.cargarCompetencia(m.id);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  cargarCompetencia(marcaId: number): void {
    this.catalogoService.listarCompetenciaDeMarca(marcaId).subscribe((competencia) => this.competencia.set(competencia));
  }

  editarCompetencia(c: MarcaCompetencia): void {
    this.competenciaEditandoId = c.id;
    this.nuevoNombre = c.nombre;
  }

  cancelarEdicion(): void {
    this.competenciaEditandoId = null;
    this.nuevoNombre = '';
  }

  guardarCompetencia(): void {
    const marca = this.marcaSeleccionada();
    if (!marca || !this.nuevoNombre.trim()) return;

    this.guardando.set(true);
    this.error.set(null);
    const request$ = this.competenciaEditandoId
      ? this.catalogoService.actualizarCompetencia(this.competenciaEditandoId, { nombre: this.nuevoNombre.trim() })
      : this.catalogoService.crearCompetencia(marca.id, { nombre: this.nuevoNombre.trim() });

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.nuevoNombre = '';
        this.competenciaEditandoId = null;
        this.cargarCompetencia(marca.id);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No fue posible guardar la marca de competencia');
        this.guardando.set(false);
      },
    });
  }

  alternarActivo(c: MarcaCompetencia): void {
    const marca = this.marcaSeleccionada();
    if (!marca) return;
    this.catalogoService
      .actualizarCompetencia(c.id, { nombre: c.nombre, activo: !c.activo })
      .subscribe(() => this.cargarCompetencia(marca.id));
  }
}
