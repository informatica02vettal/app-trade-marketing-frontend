export type EstadoExhibidor = 'OPTIMO' | 'REGULAR' | 'DETERIORADO' | 'NO_APLICA';

export type EstadoPop = 'OPTIMO' | 'REGULAR' | 'FALTANTE' | 'NO_APLICA';

export interface AuditoriaMarca {
  id: number;
  visitaId: number;
  marcaId: number;
  marcaNombre: string;
  presenciaPct: number;
  anaquelPct: number;
  frentesVettal: number;
  frentesTotales: number;
  exhibidorMarca: boolean;
  productoExhibidor: boolean;
  productoAnaquel: boolean;
  avisoFachada: boolean;
  avisoPared: boolean;
  banderines: boolean;
  rotulado: boolean;
  empleadosUniforme: boolean;
  estadoExhibidores: EstadoExhibidor | null;
  estadoPop: EstadoPop | null;
  competenciaDetectada: string | null;
  oportunidad: string | null;
  completa: boolean;
  createdAt: string;
}

export interface AuditoriaMarcaRequest {
  visitaId: number;
  marcaId: number;
  presenciaPct?: number;
  frentesVettal?: number;
  frentesTotales?: number;
  exhibidorMarca: boolean;
  productoExhibidor: boolean;
  productoAnaquel: boolean;
  avisoFachada: boolean;
  avisoPared: boolean;
  banderines: boolean;
  rotulado: boolean;
  empleadosUniforme: boolean;
  estadoExhibidores?: EstadoExhibidor | null;
  estadoPop?: EstadoPop | null;
  competenciaDetectada?: string;
  oportunidad?: string;
  /** false mientras se está llenando (guardado incremental); true en el envío final. */
  completa: boolean;
}
