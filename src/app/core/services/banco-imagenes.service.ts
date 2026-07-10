import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ArteMarca, ArteMarcaRequest, Planograma, PlanogramaRequest } from '../models/banco-imagenes.model';

const ARTES_URL = `${environment.apiBaseUrl}/artes-marca`;
const PLANOGRAMAS_URL = `${environment.apiBaseUrl}/planogramas`;

@Injectable({ providedIn: 'root' })
export class BancoImagenesService {
  constructor(private readonly http: HttpClient) {}

  listarArtesMarca(marca?: string): Observable<ArteMarca[]> {
    const params: Record<string, string> = {};
    if (marca) params['marca'] = marca;
    return this.http.get<ApiResponse<ArteMarca[]>>(ARTES_URL, { params }).pipe(map((res) => res.data));
  }

  crearArteMarca(request: ArteMarcaRequest): Observable<ArteMarca> {
    return this.http.post<ApiResponse<ArteMarca>>(ARTES_URL, request).pipe(map((res) => res.data));
  }

  eliminarArteMarca(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${ARTES_URL}/${id}`).pipe(map(() => undefined));
  }

  listarPlanogramas(tipoExhibidor?: string): Observable<Planograma[]> {
    const params: Record<string, string> = {};
    if (tipoExhibidor) params['tipoExhibidor'] = tipoExhibidor;
    return this.http.get<ApiResponse<Planograma[]>>(PLANOGRAMAS_URL, { params }).pipe(map((res) => res.data));
  }

  crearPlanograma(request: PlanogramaRequest): Observable<Planograma> {
    return this.http.post<ApiResponse<Planograma>>(PLANOGRAMAS_URL, request).pipe(map((res) => res.data));
  }

  eliminarPlanograma(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${PLANOGRAMAS_URL}/${id}`).pipe(map(() => undefined));
  }
}
