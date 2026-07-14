import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EstadoSolicitud, Solicitud, SolicitudRequest } from '../models/solicitud.model';

const BASE_URL = `${environment.apiBaseUrl}/solicitudes`;

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  constructor(private readonly http: HttpClient) {}

  listar(estado?: EstadoSolicitud, solicitanteId?: number, visitaId?: number): Observable<Solicitud[]> {
    const params: Record<string, string | number> = {};
    if (estado) params['estado'] = estado;
    if (solicitanteId) params['solicitanteId'] = solicitanteId;
    if (visitaId) params['visitaId'] = visitaId;
    return this.http.get<ApiResponse<Solicitud[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Solicitud> {
    return this.http.get<ApiResponse<Solicitud>>(`${BASE_URL}/${id}`).pipe(map((res) => res.data));
  }

  crear(request: SolicitudRequest): Observable<Solicitud> {
    return this.http.post<ApiResponse<Solicitud>>(BASE_URL, request).pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, estado: EstadoSolicitud): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${BASE_URL}/${id}/estado`, { estado }).pipe(map(() => undefined));
  }
}
