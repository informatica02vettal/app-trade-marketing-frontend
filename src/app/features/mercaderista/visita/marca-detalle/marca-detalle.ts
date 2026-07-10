import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../../../core/services/auditoria.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { MercadoService } from '../../../../core/services/mercado.service';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { VisitaService } from '../../../../core/services/visita.service';
import { EstadoExhibidor, EstadoPop } from '../../../../core/models/auditoria.model';
import { CategoriaMaterial, FamiliaMaterial, Material, MarcaCompetencia } from '../../../../core/models/catalogo.model';
import { HallazgoMercado, HallazgoMaterial, HallazgoProducto, TipoHallazgo } from '../../../../core/models/mercado.model';
import { CategoriaSolicitud, Solicitud, SolicitudItemRequest } from '../../../../core/models/solicitud.model';
import { CategoriaEvidencia } from '../../../../core/models/visita.model';
import { PhotoPicker } from '../../../../shared/ui/photo-picker/photo-picker';

type SubPaso = 'estado' | 'competencia' | 'fotos' | 'observaciones' | 'mercado' | 'solicitudes';

const ORDEN: SubPaso[] = ['estado', 'competencia', 'fotos', 'observaciones', 'mercado', 'solicitudes'];

interface MaterialSeleccionado {
  material: Material;
  medidas: string;
  ubicacion: string;
  fotos: (string | null)[];
}

@Component({
  selector: 'app-marca-detalle',
  standalone: true,
  imports: [FormsModule, PhotoPicker],
  templateUrl: './marca-detalle.html',
})
export class MarcaDetalle implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly mercadoService = inject(MercadoService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly visitaService = inject(VisitaService);

  readonly visitaId = input.required<number>();
  readonly marcaId = input.required<number>();
  readonly marcaNombre = input.required<string>();

  readonly completada = output<void>();
  readonly cancelar = output<void>();

  readonly subPaso = signal<SubPaso>('estado');
  readonly guardando = signal(false);

  // ---- Estado del exhibidor / presencia / anaquel ----
  readonly exhibidorMarca = signal(false);
  readonly productoExhibidor = signal(false);
  readonly productoAnaquel = signal(false);
  readonly avisoFachada = signal(false);
  readonly avisoPared = signal(false);
  readonly banderines = signal(false);
  readonly rotulado = signal(false);
  readonly empleadosUniforme = signal(false);
  readonly frentesVettal = signal<number | null>(null);
  readonly frentesTotales = signal<number | null>(null);
  readonly estadoExhibidores = signal<EstadoExhibidor>('NO_APLICA');
  readonly estadoPop = signal<EstadoPop>('REGULAR');

  readonly presenciaPct = computed(() => {
    const criterios = [
      this.exhibidorMarca(),
      this.productoExhibidor(),
      this.productoAnaquel(),
      this.avisoFachada(),
      this.avisoPared(),
      this.banderines(),
      this.rotulado(),
      this.empleadosUniforme(),
    ];
    const total = criterios.filter(Boolean).length;
    return Math.round((total / criterios.length) * 100);
  });

  // ---- Competencia ----
  readonly competenciaCatalogo = signal<MarcaCompetencia[]>([]);
  readonly competenciaSeleccionada = signal<Set<string>>(new Set());
  competenciaPersonalizada = '';

  // ---- Fotos ----
  readonly fotos = signal<Record<Extract<CategoriaEvidencia, 'EXHIBIDOR' | 'PRODUCTO' | 'COMPETENCIA' | 'MATERIAL_POP' | 'ANTES' | 'DESPUES'>, string | null>>({
    EXHIBIDOR: null,
    PRODUCTO: null,
    COMPETENCIA: null,
    MATERIAL_POP: null,
    ANTES: null,
    DESPUES: null,
  });

  // ---- Observaciones / oportunidad ----
  observaciones = '';
  oportunidad = '';

  // ---- Mercado (por marca) ----
  readonly mercadoTipo = signal<TipoHallazgo | ''>('');
  mercadoObservacion = '';
  mercadoDetalle = '';
  readonly mercadoProductos = signal<HallazgoProducto[]>([]);
  readonly mercadoMateriales = signal<HallazgoMaterial[]>([]);
  readonly mercadoGuardados = signal<HallazgoMercado[]>([]);
  readonly guardandoMercado = signal(false);

  // ---- Solicitudes (por marca) ----
  readonly solicitudCategoria = signal<CategoriaSolicitud | ''>('');
  readonly categoriasMaterial = signal<CategoriaMaterial[]>([]);
  readonly materialesDisponibles = signal<Material[]>([]);
  readonly materialesSeleccionados = signal<MaterialSeleccionado[]>([]);
  solicitudObservaciones = '';
  readonly solicitudesGuardadas = signal<Solicitud[]>([]);
  readonly guardandoSolicitud = signal(false);

  ngOnInit(): void {
    this.catalogoService.listarCompetenciaDeMarca(this.marcaId()).subscribe((c) => this.competenciaCatalogo.set(c));
  }

  irA(paso: SubPaso): void {
    this.subPaso.set(paso);
  }

  siguiente(): void {
    const idx = ORDEN.indexOf(this.subPaso());
    if (idx < ORDEN.length - 1) {
      this.subPaso.set(ORDEN[idx + 1]);
    }
  }

  anterior(): void {
    const idx = ORDEN.indexOf(this.subPaso());
    if (idx > 0) {
      this.subPaso.set(ORDEN[idx - 1]);
    } else {
      this.cancelar.emit();
    }
  }

  onExhibidorMarcaChange(valor: boolean): void {
    this.exhibidorMarca.set(valor);
    if (!valor) {
      this.productoExhibidor.set(false);
      this.estadoExhibidores.set('NO_APLICA');
    }
  }

  toggleCompetencia(nombre: string): void {
    const actual = new Set(this.competenciaSeleccionada());
    if (actual.has(nombre)) {
      actual.delete(nombre);
    } else {
      actual.add(nombre);
    }
    this.competenciaSeleccionada.set(actual);
  }

  agregarCompetenciaPersonalizada(): void {
    const nombre = this.competenciaPersonalizada.trim();
    if (!nombre) return;
    this.toggleCompetencia(nombre);
    this.competenciaPersonalizada = '';
  }

  setFoto(categoria: keyof ReturnType<typeof this.fotos>, url: string | null): void {
    this.fotos.set({ ...this.fotos(), [categoria]: url });
  }

  // ---- Mercado ----
  agregarProductoMercado(): void {
    this.mercadoProductos.set([...this.mercadoProductos(), { marca: '', modelo: '', precio: null, fotoUrl: null }]);
  }

  quitarProductoMercado(index: number): void {
    this.mercadoProductos.set(this.mercadoProductos().filter((_, i) => i !== index));
  }

  actualizarProductoMercado(index: number, campo: keyof HallazgoProducto, valor: string | number | null): void {
    const lista = [...this.mercadoProductos()];
    lista[index] = { ...lista[index], [campo]: valor };
    this.mercadoProductos.set(lista);
  }

  agregarMaterialMercado(): void {
    this.mercadoMateriales.set([...this.mercadoMateriales(), { material: '', marca: '', fotoUrl: null }]);
  }

  quitarMaterialMercado(index: number): void {
    this.mercadoMateriales.set(this.mercadoMateriales().filter((_, i) => i !== index));
  }

  actualizarMaterialMercado(index: number, campo: keyof HallazgoMaterial, valor: string | null): void {
    const lista = [...this.mercadoMateriales()];
    lista[index] = { ...lista[index], [campo]: valor };
    this.mercadoMateriales.set(lista);
  }

  guardarHallazgoMercado(): void {
    const tipo = this.mercadoTipo();
    if (!tipo) return;

    this.guardandoMercado.set(true);
    this.mercadoService
      .crear({
        visitaId: this.visitaId(),
        marcaId: this.marcaId(),
        tipo,
        observacionTexto: this.mercadoObservacion || undefined,
        detalle: this.mercadoDetalle || undefined,
        productos: this.mercadoProductos().length ? this.mercadoProductos() : undefined,
        materiales: this.mercadoMateriales().length ? this.mercadoMateriales() : undefined,
      })
      .subscribe({
        next: (hallazgo) => {
          this.mercadoGuardados.set([...this.mercadoGuardados(), hallazgo]);
          this.mercadoTipo.set('');
          this.mercadoObservacion = '';
          this.mercadoDetalle = '';
          this.mercadoProductos.set([]);
          this.mercadoMateriales.set([]);
          this.guardandoMercado.set(false);
        },
        error: () => this.guardandoMercado.set(false),
      });
  }

  // ---- Solicitudes ----
  onCategoriaSolicitudChange(categoria: CategoriaSolicitud): void {
    this.solicitudCategoria.set(categoria);
    this.materialesSeleccionados.set([]);
    const familia: FamiliaMaterial = categoria;
    this.catalogoService.listarCategoriasMaterial(familia).subscribe((categorias) => {
      this.categoriasMaterial.set(categorias);
      this.catalogoService.listarMateriales(this.marcaId()).subscribe((materiales) => {
        const idsCategoria = new Set(categorias.map((c) => c.id));
        this.materialesDisponibles.set(materiales.filter((m) => idsCategoria.has(m.categoriaId)));
      });
    });
  }

  estaMaterialSeleccionado(material: Material): boolean {
    return this.materialesSeleccionados().some((m) => m.material.id === material.id);
  }

  toggleMaterial(material: Material): void {
    if (this.estaMaterialSeleccionado(material)) {
      this.materialesSeleccionados.set(this.materialesSeleccionados().filter((m) => m.material.id !== material.id));
      return;
    }
    this.materialesSeleccionados.set([
      ...this.materialesSeleccionados(),
      {
        material,
        medidas: '',
        ubicacion: '',
        fotos: Array(material.minimoFotos).fill(null),
      },
    ]);
  }

  actualizarMaterialSeleccionado(materialId: number, campo: 'medidas' | 'ubicacion', valor: string): void {
    this.materialesSeleccionados.set(
      this.materialesSeleccionados().map((m) => (m.material.id === materialId ? { ...m, [campo]: valor } : m)),
    );
  }

  setFotoMaterial(materialId: number, index: number, url: string | null): void {
    this.materialesSeleccionados.set(
      this.materialesSeleccionados().map((m) => {
        if (m.material.id !== materialId) return m;
        const fotos = [...m.fotos];
        fotos[index] = url;
        return { ...m, fotos };
      }),
    );
  }

  puedeEnviarSolicitud(): boolean {
    if (!this.materialesSeleccionados().length) return false;
    return this.materialesSeleccionados().every((m) => {
      if (m.material.requiereMedidas && !m.medidas.trim()) return false;
      if (m.material.requiereUbicacion && !m.ubicacion.trim()) return false;
      if (m.fotos.some((f) => !f)) return false;
      return true;
    });
  }

  enviarSolicitud(): void {
    const categoria = this.solicitudCategoria();
    if (!categoria || !this.puedeEnviarSolicitud()) return;

    const items: SolicitudItemRequest[] = this.materialesSeleccionados().map((m) => ({
      materialId: m.material.id,
      medidas: m.medidas || undefined,
      ubicacion: m.ubicacion || undefined,
      fotos: m.fotos.filter((f): f is string => !!f),
    }));

    this.guardandoSolicitud.set(true);
    this.solicitudService
      .crear({
        visitaId: this.visitaId(),
        categoria,
        marcaId: this.marcaId(),
        observaciones: this.solicitudObservaciones || undefined,
        items,
      })
      .subscribe({
        next: (solicitud) => {
          this.solicitudesGuardadas.set([...this.solicitudesGuardadas(), solicitud]);
          this.materialesSeleccionados.set([]);
          this.solicitudObservaciones = '';
          this.guardandoSolicitud.set(false);
        },
        error: () => this.guardandoSolicitud.set(false),
      });
  }

  // ---- Guardar auditoría de la marca ----
  guardarMarca(): void {
    const frentesVettal = this.frentesVettal() ?? 0;
    const frentesTotales = this.frentesTotales() ?? 0;
    const competencia = Array.from(this.competenciaSeleccionada()).join(', ');

    this.guardando.set(true);
    this.auditoriaService
      .crear({
        visitaId: this.visitaId(),
        marcaId: this.marcaId(),
        presenciaPct: this.presenciaPct(),
        frentesVettal,
        frentesTotales,
        exhibidorMarca: this.exhibidorMarca(),
        productoExhibidor: this.productoExhibidor(),
        productoAnaquel: this.productoAnaquel(),
        avisoFachada: this.avisoFachada(),
        avisoPared: this.avisoPared(),
        banderines: this.banderines(),
        rotulado: this.rotulado(),
        empleadosUniforme: this.empleadosUniforme(),
        estadoExhibidores: this.estadoExhibidores(),
        estadoPop: this.estadoPop(),
        competenciaDetectada: competencia || undefined,
        oportunidad: this.oportunidad || undefined,
      })
      .subscribe(() => {
        const fotos = this.fotos();
        const subidas = (Object.keys(fotos) as (keyof typeof fotos)[])
          .filter((categoria) => fotos[categoria])
          .map((categoria) => this.visitaService.agregarFoto(this.visitaId(), { categoria, url: fotos[categoria]! }));

        if (!subidas.length) {
          this.guardando.set(false);
          this.completada.emit();
          return;
        }

        let restantes = subidas.length;
        subidas.forEach((obs) =>
          obs.subscribe(() => {
            restantes -= 1;
            if (restantes === 0) {
              this.guardando.set(false);
              this.completada.emit();
            }
          }),
        );
      });
  }
}
