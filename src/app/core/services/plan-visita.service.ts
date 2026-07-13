import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EstadoPlanVisita, PlanVisita, PlanVisitaReprogramarRequest, PlanVisitaRequest } from '../models/plan-visita.model';

const BASE_URL = `${environment.apiBaseUrl}/plan-visitas`;

@Injectable({ providedIn: 'root' })
export class PlanVisitaService {
  constructor(private readonly http: HttpClient) {}

  listar(usuarioId?: number, fechaDesde?: string, fechaHasta?: string, estado?: EstadoPlanVisita): Observable<PlanVisita[]> {
    const params: Record<string, string | number> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    if (fechaDesde) params['fechaDesde'] = fechaDesde;
    if (fechaHasta) params['fechaHasta'] = fechaHasta;
    if (estado) params['estado'] = estado;
    return this.http.get<ApiResponse<PlanVisita[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  crear(request: PlanVisitaRequest): Observable<PlanVisita> {
    return this.http.post<ApiResponse<PlanVisita>>(BASE_URL, request).pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, estado: EstadoPlanVisita): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${BASE_URL}/${id}/estado`, { estado }).pipe(map(() => undefined));
  }

  reprogramar(id: number, request: PlanVisitaReprogramarRequest): Observable<PlanVisita> {
    return this.http
      .patch<ApiResponse<PlanVisita>>(`${BASE_URL}/${id}/reprogramar`, request)
      .pipe(map((res) => res.data));
  }
}
