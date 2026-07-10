import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EstadoPlanVisita, PlanVisita, PlanVisitaRequest } from '../models/plan-visita.model';

const BASE_URL = `${environment.apiBaseUrl}/plan-visitas`;

@Injectable({ providedIn: 'root' })
export class PlanVisitaService {
  constructor(private readonly http: HttpClient) {}

  listar(usuarioId?: number, fecha?: string): Observable<PlanVisita[]> {
    const params: Record<string, string | number> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    if (fecha) params['fecha'] = fecha;
    return this.http.get<ApiResponse<PlanVisita[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  crear(request: PlanVisitaRequest): Observable<PlanVisita> {
    return this.http.post<ApiResponse<PlanVisita>>(BASE_URL, request).pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, estado: EstadoPlanVisita): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${BASE_URL}/${id}/estado`, { estado }).pipe(map(() => undefined));
  }
}
