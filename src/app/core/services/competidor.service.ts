import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Competidor, CompetidorRequest } from '../models/competidor.model';

const BASE_URL = `${environment.apiBaseUrl}/competidores`;

@Injectable({ providedIn: 'root' })
export class CompetidorService {
  constructor(private readonly http: HttpClient) {}

  listarPorVisita(visitaId: number): Observable<Competidor[]> {
    return this.http
      .get<ApiResponse<Competidor[]>>(BASE_URL, { params: { visitaId } })
      .pipe(map((res) => res.data));
  }

  crear(request: CompetidorRequest): Observable<Competidor> {
    return this.http.post<ApiResponse<Competidor>>(BASE_URL, request).pipe(map((res) => res.data));
  }
}
