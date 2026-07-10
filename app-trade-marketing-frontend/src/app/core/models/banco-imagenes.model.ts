export type TipoArchivo = 'IMAGEN' | 'VIDEO' | 'DOCUMENTO';

export interface ArteMarca {
  id: number;
  marca: string;
  nombre: string;
  archivoUrl: string;
  tipoArchivo: TipoArchivo;
  createdAt: string;
}

export interface ArteMarcaRequest {
  marca: string;
  nombre: string;
  archivoUrl: string;
  tipoArchivo: TipoArchivo;
}

export interface Planograma {
  id: number;
  tipoExhibidor: string;
  nombre: string;
  imagenUrl: string;
  createdAt: string;
}

export interface PlanogramaRequest {
  tipoExhibidor: string;
  nombre: string;
  imagenUrl: string;
}
