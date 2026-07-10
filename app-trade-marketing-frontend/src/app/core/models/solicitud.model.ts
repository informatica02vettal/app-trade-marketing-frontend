export type CategoriaSolicitud = 'PUBLICIDAD' | 'TRADE_MARKETING';

export type EstadoSolicitud =
  | 'PENDIENTE_APROBACION'
  | 'APROBADO'
  | 'EN_PRODUCCION'
  | 'INSTALADO'
  | 'RECHAZADO';

export interface SolicitudItem {
  id: number;
  materialId: number;
  materialNombre: string;
  medidas: string | null;
  ubicacion: string | null;
  fotos: string[];
}

export interface SolicitudItemRequest {
  materialId: number;
  medidas?: string;
  ubicacion?: string;
  fotos?: string[];
}

export interface Solicitud {
  id: number;
  visitaId: number;
  erpClienteId: string | null;
  clienteNombre: string | null;
  categoria: CategoriaSolicitud;
  marcaId: number;
  marcaNombre: string;
  observaciones: string | null;
  solicitanteId: number;
  solicitanteNombre: string;
  estado: EstadoSolicitud;
  aprobadoPorId: number | null;
  aprobadoPorNombre: string | null;
  items: SolicitudItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SolicitudRequest {
  visitaId: number;
  categoria: CategoriaSolicitud;
  marcaId: number;
  observaciones?: string;
  items: SolicitudItemRequest[];
}
