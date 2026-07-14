export type MotivoEvento = 'ANIVERSARIO_CLIENTE' | 'IMPULSO_MARCA' | 'APERTURA_TIENDA' | 'ROTACION_PRODUCTOS' | 'OTRO';

export type ParticipacionVettal = 'EXPOSITOR' | 'VISITANTE';

export interface EventoLead {
  nombre: string;
  empresa?: string;
  cargo?: string;
  telefono?: string;
  correo?: string;
}

export interface EventoVisitaRequest {
  visitaId: number;
  motivo: MotivoEvento;
  motivoOtroDetalle?: string;
  nombreEvento?: string;
  ciudad?: string;
  estado?: string;
  lugarRealizacion?: string;
  fechaEvento?: string;
  horaInicio?: string;
  horaFin?: string;
  organizador?: string;
  objetivoParticipacion?: string;
  participacionVettal?: ParticipacionVettal;
  cantidadAsistentesEstimada?: number;
  leads?: EventoLead[];
  videosEntrevistaUrls?: string[];
}

export interface EventoVisita extends EventoVisitaRequest {
  id: number;
}
