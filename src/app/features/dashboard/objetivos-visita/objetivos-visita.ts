import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ObjetivoVisitaService } from '../../../core/services/objetivo-visita.service';
import { ObjetivoVisitaSubtipo, ObjetivoVisitaTipo, ObjetivoVisitaTipoRequest } from '../../../core/models/objetivo-visita.model';

function formularioTipoVacio(): ObjetivoVisitaTipoRequest {
  return { nombre: '', activo: true };
}

@Component({
  selector: 'app-objetivos-visita',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './objetivos-visita.html',
})
export class ObjetivosVisita implements OnInit {
  private readonly objetivoVisitaService = inject(ObjetivoVisitaService);

  readonly tipos = signal<ObjetivoVisitaTipo[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  // ---- Alta / edición de tipo ----
  readonly mostrarModalTipo = signal(false);
  readonly tipoEditando = signal<ObjetivoVisitaTipo | null>(null);
  formularioTipo: ObjetivoVisitaTipoRequest = formularioTipoVacio();

  // ---- Gestión de subtipos de un tipo ----
  readonly mostrarModalSubtipos = signal(false);
  readonly tipoSeleccionado = signal<ObjetivoVisitaTipo | null>(null);
  readonly subtipos = signal<ObjetivoVisitaSubtipo[]>([]);
  nuevoSubtipoNombre = '';
  subtipoEditandoId: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.objetivoVisitaService.listarTipos().subscribe({
      next: (tipos) => {
        this.tipos.set(tipos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  // ---- Tipos ----
  abrirModalNuevoTipo(): void {
    this.tipoEditando.set(null);
    this.formularioTipo = formularioTipoVacio();
    this.error.set(null);
    this.mostrarModalTipo.set(true);
  }

  abrirModalEditarTipo(t: ObjetivoVisitaTipo): void {
    this.tipoEditando.set(t);
    this.formularioTipo = { nombre: t.nombre, activo: t.activo };
    this.error.set(null);
    this.mostrarModalTipo.set(true);
  }

  cerrarModalTipo(): void {
    this.mostrarModalTipo.set(false);
  }

  guardarTipo(): void {
    if (!this.formularioTipo.nombre.trim()) return;

    this.guardando.set(true);
    this.error.set(null);
    const editando = this.tipoEditando();
    const request$ = editando
      ? this.objetivoVisitaService.actualizarTipo(editando.id, this.formularioTipo)
      : this.objetivoVisitaService.crearTipo(this.formularioTipo);

    request$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalTipo.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No fue posible guardar el tipo de objetivo');
        this.guardando.set(false);
      },
    });
  }

  alternarActivoTipo(t: ObjetivoVisitaTipo): void {
    this.objetivoVisitaService.actualizarTipo(t.id, { nombre: t.nombre, activo: !t.activo }).subscribe(() => this.cargar());
  }

  // ---- Subtipos ----
  abrirSubtipos(t: ObjetivoVisitaTipo): void {
    this.tipoSeleccionado.set(t);
    this.nuevoSubtipoNombre = '';
    this.subtipoEditandoId = null;
    this.cargarSubtipos(t.id);
    this.mostrarModalSubtipos.set(true);
  }

  cerrarModalSubtipos(): void {
    this.mostrarModalSubtipos.set(false);
  }

  cargarSubtipos(tipoId: number): void {
    this.objetivoVisitaService.listarSubtipos(tipoId).subscribe((subtipos) => this.subtipos.set(subtipos));
  }

  editarSubtipo(s: ObjetivoVisitaSubtipo): void {
    this.subtipoEditandoId = s.id;
    this.nuevoSubtipoNombre = s.nombre;
  }

  cancelarEdicionSubtipo(): void {
    this.subtipoEditandoId = null;
    this.nuevoSubtipoNombre = '';
  }

  guardarSubtipo(): void {
    const tipo = this.tipoSeleccionado();
    if (!tipo || !this.nuevoSubtipoNombre.trim()) return;

    const request$ = this.subtipoEditandoId
      ? this.objetivoVisitaService.actualizarSubtipo(this.subtipoEditandoId, { tipoId: tipo.id, nombre: this.nuevoSubtipoNombre.trim() })
      : this.objetivoVisitaService.crearSubtipo({ tipoId: tipo.id, nombre: this.nuevoSubtipoNombre.trim() });

    request$.subscribe(() => {
      this.nuevoSubtipoNombre = '';
      this.subtipoEditandoId = null;
      this.cargarSubtipos(tipo.id);
      this.cargar();
    });
  }

  alternarActivoSubtipo(s: ObjetivoVisitaSubtipo): void {
    this.objetivoVisitaService.actualizarSubtipo(s.id, { tipoId: s.tipoId, nombre: s.nombre, activo: !s.activo }).subscribe(() => {
      const tipo = this.tipoSeleccionado();
      if (tipo) this.cargarSubtipos(tipo.id);
    });
  }
}
