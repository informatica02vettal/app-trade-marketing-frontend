export type EstadoVisita = 'EN_CURSO' | 'COMPLETADA';

export type CategoriaEvidencia =
  | 'FACHADA'
  | 'PISO_VENTAS'
  | 'EXHIBIDOR'
  | 'PRODUCTO'
  | 'COMPETENCIA'
  | 'MATERIAL_POP'
  | 'ANTES'
  | 'DESPUES'
  | 'MONTAJE'
  | 'DESARROLLO'
  | 'CIERRE';

export interface Visita {
  id: number;
  planId: number | null;
  erpClienteId: string | null;
  clienteNombre: string;
  region: string | null;
  usuarioId: number;
  usuarioNombre: string;
  ejecutivoVentas: string | null;
  checkinAt: string;
  checkoutAt: string | null;
  permanenciaMin: number | null;
  observaciones: string | null;
  estado: EstadoVisita;
  cantidadFotos: number;
}

export interface VisitaCheckinRequest {
  planId?: number;
  erpClienteId?: string;
  clienteNombre: string;
  region?: string;
  ejecutivoVentas?: string;
  checkinGpsLat?: number;
  checkinGpsLng?: number;
}

export interface VisitaCheckoutRequest {
  observaciones?: string;
}

export interface EvidenciaFoto {
  id: number;
  visitaId: number;
  categoria: CategoriaEvidencia;
  url: string;
  createdAt: string;
}

export interface EvidenciaFotoRequest {
  categoria: CategoriaEvidencia;
  url: string;
}

export interface ClienteProspecto {
  id: number;
  visitaId: number;
  nombre: string;
  rif: string;
  whatsapp: string;
  telefono: string | null;
  fotoFachadaUrl: string;
  fotoInteriorUrl: string;
  marcasCompetencia: string | null;
  usuarioId: number;
  usuarioNombre: string;
  createdAt: string;
}

export interface ClienteProspectoRequest {
  visitaId: number;
  nombre: string;
  rif: string;
  whatsapp: string;
  telefono?: string;
  fotoFachadaUrl: string;
  fotoInteriorUrl: string;
  marcasCompetencia?: string;
}
