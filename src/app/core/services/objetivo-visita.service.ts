import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ObjetivoVisitaSubtipo,
  ObjetivoVisitaSubtipoRequest,
  ObjetivoVisitaTipo,
  ObjetivoVisitaTipoRequest,
} from '../models/objetivo-visita.model';

const BASE_URL = `${environment.apiBaseUrl}/objetivos-visita`;

@Injectable({ providedIn: 'root' })
export class ObjetivoVisitaService {
  constructor(private readonly http: HttpClient) {}

  listarTipos(): Observable<ObjetivoVisitaTipo[]> {
    return this.http.get<ApiResponse<ObjetivoVisitaTipo[]>>(`${BASE_URL}/tipos`).pipe(map((res) => res.data));
  }

  crearTipo(request: ObjetivoVisitaTipoRequest): Observable<ObjetivoVisitaTipo> {
    return this.http.post<ApiResponse<ObjetivoVisitaTipo>>(`${BASE_URL}/tipos`, request).pipe(map((res) => res.data));
  }

  actualizarTipo(id: number, request: ObjetivoVisitaTipoRequest): Observable<ObjetivoVisitaTipo> {
    return this.http.put<ApiResponse<ObjetivoVisitaTipo>>(`${BASE_URL}/tipos/${id}`, request).pipe(map((res) => res.data));
  }

  listarSubtipos(tipoId?: number): Observable<ObjetivoVisitaSubtipo[]> {
    const params: Record<string, number> = {};
    if (tipoId) params['tipoId'] = tipoId;
    return this.http
      .get<ApiResponse<ObjetivoVisitaSubtipo[]>>(`${BASE_URL}/subtipos`, { params })
      .pipe(map((res) => res.data));
  }

  crearSubtipo(request: ObjetivoVisitaSubtipoRequest): Observable<ObjetivoVisitaSubtipo> {
    return this.http
      .post<ApiResponse<ObjetivoVisitaSubtipo>>(`${BASE_URL}/subtipos`, request)
      .pipe(map((res) => res.data));
  }

  actualizarSubtipo(id: number, request: ObjetivoVisitaSubtipoRequest): Observable<ObjetivoVisitaSubtipo> {
    return this.http
      .put<ApiResponse<ObjetivoVisitaSubtipo>>(`${BASE_URL}/subtipos/${id}`, request)
      .pipe(map((res) => res.data));
  }
}
