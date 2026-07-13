export interface ObjetivoVisitaTipo {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface ObjetivoVisitaTipoRequest {
  nombre: string;
  activo?: boolean;
}

export interface ObjetivoVisitaSubtipo {
  id: number;
  tipoId: number;
  tipoNombre: string;
  nombre: string;
  activo: boolean;
}

export interface ObjetivoVisitaSubtipoRequest {
  tipoId: number;
  nombre: string;
  activo?: boolean;
}
