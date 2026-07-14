import { Injectable, signal } from '@angular/core';
import { ProductoResumen } from '../models/producto.model';

export interface MarcaProgreso {
  marcaId: number;
  nombre: string;
  completada: boolean;
}

export interface DatosInicioVisita {
  visitaId: number;
  clienteNombre: string;
  erpClienteId?: string | null;
  region?: string | null;
  planId?: number | null;
  esProspecto?: boolean;
  objetivoTipoNombre?: string | null;
  objetivoSubtipoNombre?: string | null;
  productosAuditar?: ProductoResumen[];
}

/**
 * Mantiene el cliente y la visita seleccionados vigentes durante todo el
 * recorrido (Ruta -> Visita -> marca por marca -> Finalizar).
 *
 * Es un store puramente en memoria — a propósito NO se persiste en
 * localStorage ni sessionStorage: la fuente de verdad es siempre el
 * backend, para que el mercaderista pueda cambiar de teléfono o cerrar la
 * app sin perder la visita. Si este estado en memoria se pierde (recarga
 * de página, app cerrada), quien navega a `/app/visita/:id` (VisitaWizard)
 * reconstruye todo consultando lo que ya quedó guardado para esa visita
 * puntual (fotos, auditorías, evento, cliente prospecto).
 */
@Injectable({ providedIn: 'root' })
export class VisitaSessionService {
  readonly visitaId = signal<number | null>(null);
  readonly clienteNombre = signal<string | null>(null);
  readonly erpClienteId = signal<string | null>(null);
  readonly region = signal<string | null>(null);
  readonly planId = signal<number | null>(null);
  readonly esProspecto = signal<boolean>(false);
  readonly objetivoTipoNombre = signal<string | null>(null);
  readonly objetivoSubtipoNombre = signal<string | null>(null);
  readonly eventoRegistrado = signal<boolean>(false);
  readonly evidenciaGeneralCompleta = signal<boolean>(false);
  readonly productosAuditar = signal<ProductoResumen[]>([]);
  readonly marcas = signal<MarcaProgreso[]>([]);

  get hayVisitaActiva(): boolean {
    return this.visitaId() !== null;
  }

  iniciar(datos: DatosInicioVisita): void {
    this.visitaId.set(datos.visitaId);
    this.clienteNombre.set(datos.clienteNombre);
    this.erpClienteId.set(datos.erpClienteId ?? null);
    this.region.set(datos.region ?? null);
    this.planId.set(datos.planId ?? null);
    this.esProspecto.set(!!datos.esProspecto);
    this.objetivoTipoNombre.set(datos.objetivoTipoNombre ?? null);
    this.objetivoSubtipoNombre.set(datos.objetivoSubtipoNombre ?? null);
    this.eventoRegistrado.set(false);
    this.evidenciaGeneralCompleta.set(false);
    this.productosAuditar.set(datos.productosAuditar ?? []);
    this.marcas.set([]);
  }

  marcarEvidenciaGeneralCompleta(): void {
    this.evidenciaGeneralCompleta.set(true);
  }

  marcarEventoRegistrado(): void {
    this.eventoRegistrado.set(true);
  }

  /** Es "evento grande" (feria/exposición/congreso/rueda de negocios): exige registro extendido + análisis de competencia. */
  esEventoGrande(): boolean {
    const subtipo = (this.objetivoSubtipoNombre() ?? '').trim().toLowerCase();
    return ['feria', 'exposición', 'exposicion', 'congreso', 'rueda de negocios'].includes(subtipo);
  }

  marcarMarcaCompletada(marcaId: number, nombre: string): void {
    const restantes = this.marcas().filter((m) => m.marcaId !== marcaId);
    this.marcas.set([...restantes, { marcaId, nombre, completada: true }]);
  }

  estaMarcaCompletada(marcaId: number): boolean {
    return this.marcas().some((m) => m.marcaId === marcaId && m.completada);
  }

  tieneAlMenosUnaMarcaCompletada(): boolean {
    return this.marcas().some((m) => m.completada);
  }

  finalizar(): void {
    this.visitaId.set(null);
    this.clienteNombre.set(null);
    this.erpClienteId.set(null);
    this.region.set(null);
    this.planId.set(null);
    this.esProspecto.set(false);
    this.objetivoTipoNombre.set(null);
    this.objetivoSubtipoNombre.set(null);
    this.eventoRegistrado.set(false);
    this.evidenciaGeneralCompleta.set(false);
    this.productosAuditar.set([]);
    this.marcas.set([]);
  }
}
