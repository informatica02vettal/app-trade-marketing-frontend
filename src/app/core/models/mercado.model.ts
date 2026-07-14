export type TipoHallazgo =
  | 'PRECIO_COMPETENCIA'
  | 'NUEVO_PRODUCTO'
  | 'MATERIAL_PUBLICITARIO_COMPETENCIA'
  | 'OBSERVACION_MERCADO';

export interface HallazgoProducto {
  id?: number;
  marca: string | null;
  modelo: string | null;
  precio: number | null;
  fotoUrl: string | null;
}

export interface HallazgoMaterial {
  id?: number;
  material: string | null;
  marca: string | null;
  fotoUrl: string | null;
}

export interface HallazgoMercado {
  id: number;
  visitaId: number;
  tipo: TipoHallazgo;
  marcaId: number | null;
  marcaNombre: string | null;
  productoErpId: number | null;
  productoErpCodigo: string | null;
  productoErpNombre: string | null;
  categoriaProductoId: number | null;
  categoriaProductoNombre: string | null;
  marcaCompetencia: string | null;
  observacionTexto: string | null;
  detalle: string | null;
  usuarioId: number;
  usuarioNombre: string;
  productos: HallazgoProducto[];
  materiales: HallazgoMaterial[];
  createdAt: string;
}

export interface HallazgoMercadoRequest {
  visitaId: number;
  tipo: TipoHallazgo;
  marcaId?: number;
  productoErpId?: number;
  categoriaProductoId?: number;
  marcaCompetencia?: string;
  observacionTexto?: string;
  detalle?: string;
  productos?: HallazgoProducto[];
  materiales?: HallazgoMaterial[];
}
