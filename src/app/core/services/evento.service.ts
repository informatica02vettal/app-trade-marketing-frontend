import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EventoVisita, EventoVisitaRequest } from '../models/evento.model';

const BASE_URL = `${environment.apiBaseUrl}/eventos-visita`;

@Injectable({ providedIn: 'root' })
export class EventoService {
  constructor(private readonly http: HttpClient) {}

  obtenerPorVisita(visitaId: number): Observable<EventoVisita | null> {
    return this.http
      .get<ApiResponse<EventoVisita | null>>(BASE_URL, { params: { visitaId } })
      .pipe(map((res) => res.data));
  }

  crear(request: EventoVisitaRequest): Observable<EventoVisita> {
    return this.http.post<ApiResponse<EventoVisita>>(BASE_URL, request).pipe(map((res) => res.data));
  }
}
