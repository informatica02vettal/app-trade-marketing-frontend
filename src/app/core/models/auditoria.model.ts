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
  estadoExhibidores: EstadoExhibidor;
  estadoPop: EstadoPop;
  competenciaDetectada: string | null;
  oportunidad: string | null;
  createdAt: string;
}

export interface AuditoriaMarcaRequest {
  visitaId: number;
  marcaId: number;
  presenciaPct: number;
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
  estadoExhibidores: EstadoExhibidor;
  estadoPop: EstadoPop;
  competenciaDetectada?: string;
  oportunidad?: string;
}
