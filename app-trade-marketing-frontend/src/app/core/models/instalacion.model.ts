export type CategoriaInstalacion = 'PUBLICIDAD' | 'TRADE_MARKETING';

export type EstadoInstalacion = 'INSTALADO';

export interface InstalacionItem {
  id: number;
  materialId: number;
  materialNombre: string;
  fotos: string[];
}

export interface InstalacionItemRequest {
  materialId: number;
  fotos?: string[];
}

export interface Instalacion {
  id: number;
  visitaId: number;
  erpClienteId: string | null;
  clienteNombre: string | null;
  marcaId: number;
  marcaNombre: string;
  categoria: CategoriaInstalacion;
  usuarioId: number;
  usuarioNombre: string;
  observaciones: string | null;
  fechaInstalacion: string | null;
  estado: EstadoInstalacion;
  items: InstalacionItem[];
}

export interface InstalacionRequest {
  visitaId: number;
  marcaId: number;
  categoria: CategoriaInstalacion;
  observaciones?: string;
  fechaInstalacion?: string;
  items: InstalacionItemRequest[];
}
