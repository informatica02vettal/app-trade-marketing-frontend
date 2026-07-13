import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AsignacionCliente,
  AsignacionClienteRequest,
  ClienteErp,
  ClienteLocal,
  SincronizacionResultado,
  SucursalLocal,
} from '../models/cliente.model';

const CLIENTES_URL = `${environment.apiBaseUrl}/clientes`;
const ASIGNACIONES_URL = `${environment.apiBaseUrl}/asignaciones`;

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private readonly http: HttpClient) {}

  buscar(nombre?: string, id?: string): Observable<ClienteErp[]> {
    const params: Record<string, string> = {};
    if (nombre) params['nombre'] = nombre;
    if (id) params['id'] = id;
    return this.http.get<ApiResponse<ClienteErp[]>>(CLIENTES_URL, { params }).pipe(map((res) => res.data));
  }

  obtener(id: string): Observable<ClienteErp> {
    return this.http.get<ApiResponse<ClienteErp>>(`${CLIENTES_URL}/${id}`).pipe(map((res) => res.data));
  }

  listarAsignaciones(usuarioId?: number, erpClienteId?: string): Observable<AsignacionCliente[]> {
    const params: Record<string, string | number> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    if (erpClienteId) params['erpClienteId'] = erpClienteId;
    return this.http
      .get<ApiResponse<AsignacionCliente[]>>(ASIGNACIONES_URL, { params })
      .pipe(map((res) => res.data));
  }

  crearAsignacion(request: AsignacionClienteRequest): Observable<AsignacionCliente> {
    return this.http
      .post<ApiResponse<AsignacionCliente>>(ASIGNACIONES_URL, request)
      .pipe(map((res) => res.data));
  }

  eliminarAsignacion(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${ASIGNACIONES_URL}/${id}`).pipe(map(() => undefined));
  }

  listarLocales(): Observable<ClienteLocal[]> {
    return this.http.get<ApiResponse<ClienteLocal[]>>(`${CLIENTES_URL}/locales`).pipe(map((res) => res.data));
  }

  sincronizar(): Observable<SincronizacionResultado> {
    return this.http
      .post<ApiResponse<SincronizacionResultado>>(`${CLIENTES_URL}/sincronizar`, {})
      .pipe(map((res) => res.data));
  }

  listarSucursalesLocales(codigoCliente: string): Observable<SucursalLocal[]> {
    return this.http
      .get<ApiResponse<SucursalLocal[]>>(`${CLIENTES_URL}/locales/${codigoCliente}/sucursales`)
      .pipe(map((res) => res.data));
  }
}
