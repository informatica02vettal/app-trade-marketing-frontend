import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Instalacion, InstalacionRequest } from '../models/instalacion.model';

const BASE_URL = `${environment.apiBaseUrl}/instalaciones`;

@Injectable({ providedIn: 'root' })
export class InstalacionService {
  constructor(private readonly http: HttpClient) {}

  listar(usuarioId?: number, visitaId?: number): Observable<Instalacion[]> {
    const params: Record<string, number> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    if (visitaId) params['visitaId'] = visitaId;
    return this.http.get<ApiResponse<Instalacion[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Instalacion> {
    return this.http.get<ApiResponse<Instalacion>>(`${BASE_URL}/${id}`).pipe(map((res) => res.data));
  }

  crear(request: InstalacionRequest): Observable<Instalacion> {
    return this.http.post<ApiResponse<Instalacion>>(BASE_URL, request).pipe(map((res) => res.data));
  }
}
