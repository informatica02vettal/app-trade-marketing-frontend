import { Injectable, signal } from '@angular/core';

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
}

interface EstadoPersistido {
  visitaId: number;
  clienteNombre: string;
  erpClienteId: string | null;
  region: string | null;
  planId: number | null;
  esProspecto: boolean;
  evidenciaGeneralCompleta: boolean;
  marcas: MarcaProgreso[];
}

const STORAGE_KEY = 'tm_visita_activa';

/**
 * Mantiene el cliente y la visita seleccionados vigentes durante todo el
 * recorrido (Ruta -> Visita -> marca por marca -> Finalizar), para que
 * ningún módulo tenga que volver a pedir esa información.
 */
@Injectable({ providedIn: 'root' })
export class VisitaSessionService {
  readonly visitaId = signal<number | null>(null);
  readonly clienteNombre = signal<string | null>(null);
  readonly erpClienteId = signal<string | null>(null);
  readonly region = signal<string | null>(null);
  readonly planId = signal<number | null>(null);
  readonly esProspecto = signal<boolean>(false);
  readonly evidenciaGeneralCompleta = signal<boolean>(false);
  readonly marcas = signal<MarcaProgreso[]>([]);

  constructor() {
    this.restaurar();
  }

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
    this.evidenciaGeneralCompleta.set(false);
    this.marcas.set([]);
    this.persistir();
  }

  marcarEvidenciaGeneralCompleta(): void {
    this.evidenciaGeneralCompleta.set(true);
    this.persistir();
  }

  marcarMarcaCompletada(marcaId: number, nombre: string): void {
    const restantes = this.marcas().filter((m) => m.marcaId !== marcaId);
    this.marcas.set([...restantes, { marcaId, nombre, completada: true }]);
    this.persistir();
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
    this.evidenciaGeneralCompleta.set(false);
    this.marcas.set([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private persistir(): void {
    const estado: EstadoPersistido = {
      visitaId: this.visitaId()!,
      clienteNombre: this.clienteNombre()!,
      erpClienteId: this.erpClienteId(),
      region: this.region(),
      planId: this.planId(),
      esProspecto: this.esProspecto(),
      evidenciaGeneralCompleta: this.evidenciaGeneralCompleta(),
      marcas: this.marcas(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  private restaurar(): void {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const estado = JSON.parse(raw) as EstadoPersistido;
    this.visitaId.set(estado.visitaId);
    this.clienteNombre.set(estado.clienteNombre);
    this.erpClienteId.set(estado.erpClienteId);
    this.region.set(estado.region);
    this.planId.set(estado.planId);
    this.esProspecto.set(estado.esProspecto);
    this.evidenciaGeneralCompleta.set(estado.evidenciaGeneralCompleta);
    this.marcas.set(estado.marcas ?? []);
  }
}
