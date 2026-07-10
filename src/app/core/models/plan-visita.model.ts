export type TipoVisita = 'PLANIFICADA' | 'NO_PLANIFICADA';

export type EstadoPlanVisita = 'PENDIENTE' | 'EJECUTADA' | 'REPROGRAMADA';

export interface PlanVisita {
  id: number;
  erpClienteId: string | null;
  clienteNombre: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  region: string | null;
  fechaProgramada: string;
  horaProgramada: string | null;
  objetivo: string | null;
  tipoVisita: TipoVisita;
  estado: EstadoPlanVisita;
}

export interface PlanVisitaRequest {
  erpClienteId?: string;
  clienteNombre: string;
  usuarioId?: number;
  region?: string;
  fechaProgramada: string;
  horaProgramada?: string;
  objetivo?: string;
  tipoVisita?: TipoVisita;
}
