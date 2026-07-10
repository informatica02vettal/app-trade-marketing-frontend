import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuditoriaMarca, AuditoriaMarcaRequest } from '../models/auditoria.model';

const BASE_URL = `${environment.apiBaseUrl}/auditorias`;

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  constructor(private readonly http: HttpClient) {}

  listarPorVisita(visitaId: number): Observable<AuditoriaMarca[]> {
    return this.http
      .get<ApiResponse<AuditoriaMarca[]>>(BASE_URL, { params: { visitaId } })
      .pipe(map((res) => res.data));
  }

  crear(request: AuditoriaMarcaRequest): Observable<AuditoriaMarca> {
    return this.http.post<ApiResponse<AuditoriaMarca>>(BASE_URL, request).pipe(map((res) => res.data));
  }
}
