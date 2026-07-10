export interface CoberturaRegion {
  region: string;
  visitasPlanificadas: number;
  visitasEjecutadas: number;
  cumplimientoPct: number;
}

export interface CumplimientoMercaderista {
  usuarioId: number;
  usuarioNombre: string;
  visitasPlanificadas: number;
  visitasEjecutadas: number;
  cumplimientoPct: number;
}

export interface KpiDashboard {
  fecha: string;
  visitasPlanificadas: number;
  visitasEjecutadas: number;
  cumplimientoVisitasPct: number;
  clientesAtendidos: number;
  presenciaMarcaPct: number;
  participacionAnaquelPct: number;
  oportunidadesDetectadas: number;
  solicitudesGeneradas: number;
  coberturaPorRegion: CoberturaRegion[];
  cumplimientoPorMercaderista: CumplimientoMercaderista[];
}
