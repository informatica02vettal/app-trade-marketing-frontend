export interface ClienteErp {
  id: string;
  nombre: string;
  mercaderistaAsignadoId: number | null;
  mercaderistaAsignadoNombre: string | null;
}

export interface AsignacionCliente {
  id: number;
  erpClienteId: string;
  clienteNombre: string | null;
  usuarioId: number;
  usuarioNombre: string;
  region: string | null;
  activo: boolean;
}

export interface AsignacionClienteRequest {
  erpClienteId: string;
  clienteNombre?: string;
  usuarioId: number;
  region?: string;
}

export interface ClienteLocal {
  codigoCliente: string;
  rif: string | null;
  nombreFiscal: string | null;
  nombreComercial: string | null;
  direccionFiscal: string | null;
  telefonoPrincipal: string | null;
  celular: string | null;
  email: string | null;
  estado: string | null;
  ciudad: string | null;
  municipio: string | null;
  fechaCreacionErp: string | null;
  sincronizadoEn: string;
}

export interface SincronizacionResultado {
  clientesSincronizados: number;
  sucursalesSincronizadas: number;
  sincronizadoEn: string;
}
