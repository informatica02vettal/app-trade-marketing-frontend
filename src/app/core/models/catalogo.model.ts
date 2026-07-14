export type FamiliaMaterial = 'PUBLICIDAD' | 'TRADE_MARKETING';

export interface Marca {
  id: number;
  codigo: string;
  nombre: string;
}

export interface MarcaCompetencia {
  id: number;
  marcaId: number;
  nombre: string;
  activo: boolean;
}

export interface MarcaCompetenciaRequest {
  nombre: string;
  activo?: boolean;
}

export interface CategoriaMaterial {
  id: number;
  familia: FamiliaMaterial;
  nombre: string;
}

export interface Material {
  id: number;
  nombre: string;
  categoriaId: number;
  categoriaNombre: string;
  marcaId: number | null;
  requiereMedidas: boolean;
  requiereUbicacion: boolean;
  minimoFotos: number;
}

export interface CategoriaProductoMercado {
  id: number;
  nombre: string;
  marcaId: number;
}
