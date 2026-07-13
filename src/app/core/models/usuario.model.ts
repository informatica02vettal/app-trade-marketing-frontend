export type RolUsuario = 'MERCADERISTA' | 'SUPERVISOR' | 'ADMIN';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  region: string | null;
  ejecutivoAsociado: string | null;
  rol: RolUsuario;
  activo: boolean;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  region?: string;
  ejecutivoAsociado?: string;
  rol: RolUsuario;
  activo?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
