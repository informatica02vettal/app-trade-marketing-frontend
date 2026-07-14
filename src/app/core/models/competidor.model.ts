export interface CompetidorRequest {
  visitaId: number;
  nombreEmpresa: string;
  marcasRepresentadas?: string;
  tipoProductosExhibidos?: string;
  tamanoStand?: string;
  cantidadPromotores?: number;
  cantidadPersonalTecnico?: number;
  poseeInflables?: boolean;
  poseeToldos?: boolean;
  poseePantallaLed?: boolean;
  poseeExperienciasInteractivas?: boolean;
  realizaDemostraciones?: boolean;
  entregaMaterialPop?: boolean;
  entregaMuestras?: boolean;
  realizaRifasConcursos?: boolean;
  realizaPromocionesEspeciales?: boolean;
  cuentaActivaciones?: boolean;
  poseeExhibidoresDiferenciadores?: boolean;
  utilizaMascotasPublicitarias?: boolean;
  observaciones?: string;
  fotosStand?: string[];
  fotosMaterialPublicitario?: string[];
}

export interface Competidor extends CompetidorRequest {
  id: number;
}
