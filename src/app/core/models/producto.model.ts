export interface ProductoResumen {
  id: number;
  codigo: string;
  producto: string | null;
  nombreComercial: string | null;
  marca: string | null;
}

export interface ProductoLocal {
  id: number;
  codigo: string;
  producto: string | null;
  linea: string | null;
  subcategoria: string | null;
  marca: string | null;
  contenido: string | null;
  peso: number | null;
  precio: number | null;
  fotoUrl: string | null;
  nombreComercial: string | null;
  detalles: string | null;
  sincronizadoEn: string;
}

export interface SincronizacionProductosResultado {
  productosSincronizados: number;
  sincronizadoEn: string;
}
