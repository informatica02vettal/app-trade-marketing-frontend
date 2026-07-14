import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuditoriaService } from '../../../../core/services/auditoria.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { MercadoService } from '../../../../core/services/mercado.service';
import { SolicitudService } from '../../../../core/services/solicitud.service';
import { VisitaService } from '../../../../core/services/visita.service';
import { VisitaSessionService } from '../../../../core/session/visita-session.service';
import { AuditoriaMarca, EstadoExhibidor, EstadoPop } from '../../../../core/models/auditoria.model';
import { CategoriaMaterial, FamiliaMaterial, MarcaCompetencia, Material } from '../../../../core/models/catalogo.model';
import { HallazgoMercado, HallazgoMaterial, HallazgoProducto, TipoHallazgo } from '../../../../core/models/mercado.model';
import { CategoriaSolicitud, Solicitud, SolicitudItemRequest } from '../../../../core/models/solicitud.model';
import { CategoriaEvidencia } from '../../../../core/models/visita.model';
import { PhotoPicker } from '../../../../shared/ui/photo-picker/photo-picker';

type SubPaso = 'presencia' | 'estado' | 'fotos' | 'competencia' | 'observaciones' | 'mercado' | 'solicitudes';

const ORDEN: SubPaso[] = ['presencia', 'estado', 'fotos', 'competencia', 'observaciones', 'mercado', 'solicitudes'];

type CategoriaFotoMarca = Extract<CategoriaEvidencia, 'EXHIBIDOR' | 'PRODUCTO' | 'COMPETENCIA' | 'MATERIAL_POP' | 'ANTES' | 'DESPUES'>;
type FotosMarca = Record<CategoriaFotoMarca, string | null>;

function fotosVacias(): FotosMarca {
  return { EXHIBIDOR: null, PRODUCTO: null, COMPETENCIA: null, MATERIAL_POP: null, ANTES: null, DESPUES: null };
}

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
  private readonly sesion = inject(VisitaSessionService);

  readonly visitaId = input.required<number>();
  readonly marcaId = input.required<number>();
  readonly marcaNombre = input.required<string>();

  readonly completada = output<void>();
  readonly cancelar = output<void>();

  readonly subPaso = signal<SubPaso>('presencia');
  readonly guardando = signal(false);
  readonly presenciaMarca = signal<boolean | null>(null);

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

  // ---- Competencia (marcas que le hacen competencia a esta marca) ----
  readonly competenciaCatalogo = signal<MarcaCompetencia[]>([]);
  readonly competenciaSeleccionada = signal<Set<string>>(new Set());
  readonly agregandoCompetencia = signal(false);
  competenciaPersonalizada = '';

  // ---- Fotos ----
  // Cada foto se sube al backend en el momento (agregarFoto), asociada a
  // esta marca — así queda en la base de datos de inmediato y se puede
  // recuperar en cualquier dispositivo, sin depender del navegador.
  readonly fotos = signal<FotosMarca>(fotosVacias());

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
  readonly productoErpSeleccionadoId = signal<number | null>(null);

  // Productos propios del plan de esta visita, priorizando los de esta marca.
  readonly productosPropiosDisponibles = computed(() => {
    const productos = this.sesion.productosAuditar();
    const marca = this.marcaNombre().trim().toLowerCase();
    const coincidentes = productos.filter((p) => (p.marca ?? '').trim().toLowerCase() === marca);
    return coincidentes.length ? coincidentes : productos;
  });

  // Al elegir el producto propio a auditar, adelanta directo al formulario de
  // "precio de competencia" (con una fila lista para llenar) en vez de dejar
  // que el mercaderista tenga que elegir el tipo de hallazgo por su cuenta.
  onProductoErpSeleccionado(id: number | null): void {
    this.productoErpSeleccionadoId.set(id);
    if (id !== null && !this.mercadoTipo()) {
      this.mercadoTipo.set('PRECIO_COMPETENCIA');
      if (!this.mercadoProductos().length) {
        this.agregarProductoMercado();
      }
    }
  }

  // ---- Solicitudes (por marca) ----
  readonly solicitudCategoria = signal<CategoriaSolicitud | ''>('');
  readonly categoriasMaterial = signal<CategoriaMaterial[]>([]);
  readonly materialesDisponibles = signal<Material[]>([]);
  readonly materialesSeleccionados = signal<MaterialSeleccionado[]>([]);
  solicitudObservaciones = '';
  readonly solicitudesGuardadas = signal<Solicitud[]>([]);
  readonly guardandoSolicitud = signal(false);

  ngOnInit(): void {
    this.catalogoService
      .listarCompetenciaDeMarca(this.marcaId())
      .subscribe((catalogo) => this.competenciaCatalogo.set(catalogo.filter((c) => c.activo)));

    // Si esta marca ya tenía una auditoría en progreso (o completa) guardada
    // en el backend, se recupera todo el formulario desde ahí — funciona
    // igual sin importar desde qué dispositivo se entre.
    this.auditoriaService.listarPorVisita(this.visitaId()).subscribe((auditorias) => {
      const existente = auditorias.find((a) => a.marcaId === this.marcaId());
      if (existente) {
        this.prefillDesdeAuditoriaExistente(existente);
      }
    });

    this.visitaService.listarFotos(this.visitaId()).subscribe((fotos) => {
      const propias = fotos.filter((f) => f.marcaId === this.marcaId());
      const ultimaPorCategoria = (categoria: CategoriaFotoMarca): string | null => {
        const coincidencias = propias.filter((f) => f.categoria === categoria);
        return coincidencias.length ? coincidencias[coincidencias.length - 1].url : null;
      };
      this.fotos.set({
        EXHIBIDOR: ultimaPorCategoria('EXHIBIDOR'),
        PRODUCTO: ultimaPorCategoria('PRODUCTO'),
        COMPETENCIA: ultimaPorCategoria('COMPETENCIA'),
        MATERIAL_POP: ultimaPorCategoria('MATERIAL_POP'),
        ANTES: ultimaPorCategoria('ANTES'),
        DESPUES: ultimaPorCategoria('DESPUES'),
      });
    });
  }

  private prefillDesdeAuditoriaExistente(a: AuditoriaMarca): void {
    this.presenciaMarca.set(true);
    this.subPaso.set('estado');
    this.exhibidorMarca.set(a.exhibidorMarca);
    this.productoExhibidor.set(a.productoExhibidor);
    this.productoAnaquel.set(a.productoAnaquel);
    this.avisoFachada.set(a.avisoFachada);
    this.avisoPared.set(a.avisoPared);
    this.banderines.set(a.banderines);
    this.rotulado.set(a.rotulado);
    this.empleadosUniforme.set(a.empleadosUniforme);
    this.frentesVettal.set(a.frentesVettal || null);
    this.frentesTotales.set(a.frentesTotales || null);
    if (a.estadoExhibidores) this.estadoExhibidores.set(a.estadoExhibidores);
    if (a.estadoPop) this.estadoPop.set(a.estadoPop);
    this.oportunidad = a.oportunidad ?? '';
    if (a.competenciaDetectada) {
      this.competenciaSeleccionada.set(new Set(a.competenciaDetectada.split(', ').filter(Boolean)));
    }
  }

  irA(paso: SubPaso): void {
    this.subPaso.set(paso);
  }

  // Guarda (o actualiza) de inmediato el progreso de esta auditoría en el
  // backend — se llama después de cada respuesta para que nada dependa de
  // llegar hasta el final del formulario.
  private guardarProgreso(completa: boolean): Observable<AuditoriaMarca> {
    const competencia = Array.from(this.competenciaSeleccionada()).join(', ');
    return this.auditoriaService.crear({
      visitaId: this.visitaId(),
      marcaId: this.marcaId(),
      presenciaPct: this.presenciaPct(),
      frentesVettal: this.frentesVettal() ?? undefined,
      frentesTotales: this.frentesTotales() ?? undefined,
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
      completa,
    });
  }

  // ---- Competencia ----
  toggleCompetencia(nombre: string): void {
    const actual = new Set(this.competenciaSeleccionada());
    if (actual.has(nombre)) {
      actual.delete(nombre);
    } else {
      actual.add(nombre);
    }
    this.competenciaSeleccionada.set(actual);
    this.guardarProgreso(false).subscribe();
  }

  agregarCompetenciaPersonalizada(): void {
    const nombre = this.competenciaPersonalizada.trim();
    if (!nombre || this.agregandoCompetencia()) return;

    this.agregandoCompetencia.set(true);
    this.catalogoService.crearCompetencia(this.marcaId(), { nombre }).subscribe({
      next: (creada) => {
        this.competenciaCatalogo.set([...this.competenciaCatalogo(), creada]);
        this.toggleCompetencia(creada.nombre);
        this.competenciaPersonalizada = '';
        this.agregandoCompetencia.set(false);
      },
      error: () => this.agregandoCompetencia.set(false),
    });
  }

  // ---- Presencia de marca (primer paso, filtra el resto del flujo) ----
  confirmarPresencia(existe: boolean): void {
    this.presenciaMarca.set(existe);
    if (existe) {
      this.subPaso.set('estado');
      this.guardarProgreso(false).subscribe();
    } else {
      this.guardarSinPresencia();
    }
  }

  private guardarSinPresencia(): void {
    this.guardando.set(true);
    this.auditoriaService
      .crear({
        visitaId: this.visitaId(),
        marcaId: this.marcaId(),
        presenciaPct: 0,
        frentesVettal: 0,
        frentesTotales: 0,
        exhibidorMarca: false,
        productoExhibidor: false,
        productoAnaquel: false,
        avisoFachada: false,
        avisoPared: false,
        banderines: false,
        rotulado: false,
        empleadosUniforme: false,
        estadoExhibidores: 'NO_APLICA',
        estadoPop: 'NO_APLICA',
        oportunidad: 'Sin presencia de la marca en este local.',
        completa: true,
      })
      .subscribe(() => {
        this.guardando.set(false);
        this.completada.emit();
      });
  }

  // La foto de la competencia es obligatoria para poder avanzar desde ese paso.
  puedeAvanzar(): boolean {
    if (this.subPaso() === 'competencia') {
      return !!this.fotos().COMPETENCIA;
    }
    return true;
  }

  siguiente(): void {
    if (!this.puedeAvanzar()) return;
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

  claseBotonSiNo(valorActual: boolean, esBotonSi: boolean): string {
    const base = 'rounded-lg border px-3.5 py-1.5 text-[12px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
    const activo = esBotonSi ? valorActual : !valorActual;
    if (!activo) return `${base} bg-panel-alt border-line text-muted`;
    return esBotonSi ? `${base} bg-success-tint border-success text-success` : `${base} bg-danger-tint border-danger text-danger`;
  }

  onExhibidorMarcaChange(valor: boolean): void {
    this.exhibidorMarca.set(valor);
    if (!valor) {
      this.productoExhibidor.set(false);
      this.estadoExhibidores.set('NO_APLICA');
    }
    this.guardarProgreso(false).subscribe();
  }

  actualizarChecklist(
    campo: 'productoExhibidor' | 'productoAnaquel' | 'avisoFachada' | 'avisoPared' | 'banderines' | 'rotulado' | 'empleadosUniforme',
    valor: boolean,
  ): void {
    this[campo].set(valor);
    this.guardarProgreso(false).subscribe();
  }

  actualizarFrentes(campo: 'frentesVettal' | 'frentesTotales', valor: number | null): void {
    this[campo].set(valor);
    this.guardarProgreso(false).subscribe();
  }

  actualizarEstadoExhibidores(valor: EstadoExhibidor): void {
    this.estadoExhibidores.set(valor);
    this.guardarProgreso(false).subscribe();
  }

  actualizarEstadoPop(valor: EstadoPop): void {
    this.estadoPop.set(valor);
    this.guardarProgreso(false).subscribe();
  }

  guardarOportunidad(): void {
    this.guardarProgreso(false).subscribe();
  }

  setFoto(categoria: keyof ReturnType<typeof this.fotos>, url: string | null): void {
    this.fotos.set({ ...this.fotos(), [categoria]: url });
    if (url) {
      this.visitaService.agregarFoto(this.visitaId(), { categoria, url, marcaId: this.marcaId() }).subscribe();
    }
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
        productoErpId: this.productoErpSeleccionadoId() ?? undefined,
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

  // ---- Guardar auditoría de la marca (envío final) ----
  guardarMarca(): void {
    this.guardando.set(true);
    this.guardarProgreso(true).subscribe({
      next: () => {
        this.guardando.set(false);
        this.completada.emit();
      },
      error: () => this.guardando.set(false),
    });
  }
}
