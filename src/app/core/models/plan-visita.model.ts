import { ProductoResumen } from './producto.model';

export type TipoVisita = 'PLANIFICADA' | 'NO_PLANIFICADA';

export type EstadoPlanVisita = 'PENDIENTE' | 'EJECUTADA' | 'REPROGRAMADA';

export interface PlanVisita {
  id: number;
  erpClienteId: string | null;
  sucursalId: number | null;
  sucursalNombre: string | null;
  clienteNombre: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  region: string | null;
  fechaProgramada: string;
  horaProgramada: string | null;
  objetivo: string | null;
  objetivoTipoId: number | null;
  objetivoTipoNombre: string | null;
  objetivoSubtipoId: number | null;
  objetivoSubtipoNombre: string | null;
  comentario: string | null;
  tipoVisita: TipoVisita;
  estado: EstadoPlanVisita;
  productosAuditar: ProductoResumen[];
}

export interface PlanVisitaRequest {
  erpClienteId?: string;
  sucursalId?: number;
  clienteNombre: string;
  usuarioId?: number;
  region?: string;
  fechaProgramada: string;
  horaProgramada?: string;
  objetivoTipoId?: number;
  objetivoSubtipoId?: number;
  comentario?: string;
  tipoVisita?: TipoVisita;
  productoErpIds?: number[];
}

export interface PlanVisitaReprogramarRequest {
  fechaProgramada: string;
  horaProgramada: string;
}
