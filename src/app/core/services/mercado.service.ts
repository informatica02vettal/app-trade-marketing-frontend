import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { HallazgoMercado, HallazgoMercadoRequest, TipoHallazgo } from '../models/mercado.model';

const BASE_URL = `${environment.apiBaseUrl}/mercado`;

@Injectable({ providedIn: 'root' })
export class MercadoService {
  constructor(private readonly http: HttpClient) {}

  listar(
    opts: { tipo?: TipoHallazgo; usuarioId?: number; marcaId?: number; visitaId?: number } = {},
  ): Observable<HallazgoMercado[]> {
    const params: Record<string, string | number> = {};
    if (opts.tipo) params['tipo'] = opts.tipo;
    if (opts.usuarioId) params['usuarioId'] = opts.usuarioId;
    if (opts.marcaId) params['marcaId'] = opts.marcaId;
    if (opts.visitaId) params['visitaId'] = opts.visitaId;
    return this.http.get<ApiResponse<HallazgoMercado[]>>(BASE_URL, { params }).pipe(map((res) => res.data));
  }

  crear(request: HallazgoMercadoRequest): Observable<HallazgoMercado> {
    return this.http.post<ApiResponse<HallazgoMercado>>(BASE_URL, request).pipe(map((res) => res.data));
  }
}
