import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Marca, MarcaCompetencia, MarcaRequest } from '../../../core/models/catalogo.model';

function marcaFormularioVacio(): MarcaRequest {
  return { codigo: '', nombre: '' };
}

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

  // ---- Alta de marca / activar-desactivar ----
  readonly mostrarModalMarca = signal(false);
  readonly guardandoMarca = signal(false);
  formularioMarca: MarcaRequest = marcaFormularioVacio();

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

  // ---- Alta de marca ----
  abrirModalNuevaMarca(): void {
    this.formularioMarca = marcaFormularioVacio();
    this.error.set(null);
    this.mostrarModalMarca.set(true);
  }

  cerrarModalMarca(): void {
    this.mostrarModalMarca.set(false);
  }

  guardarMarcaDeshabilitado(): boolean {
    return this.guardandoMarca() || !this.formularioMarca.codigo.trim() || !this.formularioMarca.nombre.trim();
  }

  guardarMarca(): void {
    if (this.guardarMarcaDeshabilitado()) return;

    this.guardandoMarca.set(true);
    this.error.set(null);
    this.catalogoService
      .crearMarca({ codigo: this.formularioMarca.codigo.trim(), nombre: this.formularioMarca.nombre.trim() })
      .subscribe({
        next: () => {
          this.guardandoMarca.set(false);
          this.mostrarModalMarca.set(false);
          this.cargar();
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No fue posible crear la marca');
          this.guardandoMarca.set(false);
        },
      });
  }

  // Al desactivar una marca, la app de mercaderistas deja de mostrarla en el
  // selector de marcas a auditar (filtra por activo del lado del cliente).
  desactivarMarca(m: Marca): void {
    this.error.set(null);
    this.catalogoService.cambiarEstadoMarca(m.id, false).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message || 'No fue posible desactivar la marca'),
    });
  }

  reactivarMarca(m: Marca): void {
    this.error.set(null);
    this.catalogoService.cambiarEstadoMarca(m.id, true).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error.set(err?.error?.message || 'No fue posible reactivar la marca'),
    });
  }

  // ---- Gestión de competencia ----
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
