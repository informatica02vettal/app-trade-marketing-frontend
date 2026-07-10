import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ClienteProspecto,
  ClienteProspectoRequest,
  EvidenciaFoto,
  EvidenciaFotoRequest,
  Visita,
  VisitaCheckinRequest,
  VisitaCheckoutRequest,
} from '../models/visita.model';

const BASE_URL = `${environment.apiBaseUrl}/visitas`;

@Injectable({ providedIn: 'root' })
export class VisitaService {
  constructor(private readonly http: HttpClient) {}

  listar(usuarioId?: number): Observable<Visita[]> {
    const params: Record<string, number> = {};
    if (usuarioId) params['usuarioId'] = usuarioId;
    return this.http.get<ApiResponse<Visita[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  checkin(request: VisitaCheckinRequest): Observable<Visita> {
    return this.http.post<ApiResponse<Visita>>(BASE_URL, request).pipe(map((res) => res.data));
  }

  agregarFoto(visitaId: number, request: EvidenciaFotoRequest): Observable<EvidenciaFoto> {
    return this.http
      .post<ApiResponse<EvidenciaFoto>>(`${BASE_URL}/${visitaId}/fotos`, request)
      .pipe(map((res) => res.data));
  }

  checkout(visitaId: number, request: VisitaCheckoutRequest): Observable<Visita> {
    return this.http
      .patch<ApiResponse<Visita>>(`${BASE_URL}/${visitaId}/checkout`, request)
      .pipe(map((res) => res.data));
  }

  listarClientesProspecto(visitaId: number): Observable<ClienteProspecto[]> {
    return this.http
      .get<ApiResponse<ClienteProspecto[]>>(`${BASE_URL}/clientes-prospecto`, { params: { visitaId } })
      .pipe(map((res) => res.data));
  }

  crearClienteProspecto(request: ClienteProspectoRequest): Observable<ClienteProspecto> {
    return this.http
      .post<ApiResponse<ClienteProspecto>>(`${BASE_URL}/clientes-prospecto`, request)
      .pipe(map((res) => res.data));
  }
}
