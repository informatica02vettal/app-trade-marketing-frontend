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
