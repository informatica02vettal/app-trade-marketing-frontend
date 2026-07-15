import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CategoriaMaterial,
  CategoriaProductoMercado,
  FamiliaMaterial,
  Marca,
  MarcaCompetencia,
  MarcaCompetenciaRequest,
  Material,
  Region,
  RegionRequest,
} from '../models/catalogo.model';

const BASE_URL = `${environment.apiBaseUrl}/catalogos`;

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  constructor(private readonly http: HttpClient) {}

  listarMarcas(): Observable<Marca[]> {
    return this.http
      .get<ApiResponse<Marca[]>>(`${BASE_URL}/marcas`)
      .pipe(map((res) => res.data));
  }

  listarCompetenciaDeMarca(marcaId: number): Observable<MarcaCompetencia[]> {
    return this.http
      .get<ApiResponse<MarcaCompetencia[]>>(`${BASE_URL}/marcas/${marcaId}/competencia`)
      .pipe(map((res) => res.data));
  }

  crearCompetencia(marcaId: number, request: MarcaCompetenciaRequest): Observable<MarcaCompetencia> {
    return this.http
      .post<ApiResponse<MarcaCompetencia>>(`${BASE_URL}/marcas/${marcaId}/competencia`, request)
      .pipe(map((res) => res.data));
  }

  actualizarCompetencia(id: number, request: MarcaCompetenciaRequest): Observable<MarcaCompetencia> {
    return this.http
      .put<ApiResponse<MarcaCompetencia>>(`${BASE_URL}/competencia/${id}`, request)
      .pipe(map((res) => res.data));
  }

  listarCategoriasMaterial(familia?: FamiliaMaterial): Observable<CategoriaMaterial[]> {
    return this.http
      .get<ApiResponse<CategoriaMaterial[]>>(`${BASE_URL}/categorias-material`, {
        params: familia ? { familia } : {},
      })
      .pipe(map((res) => res.data));
  }

  listarMateriales(marcaId: number, categoriaId?: number): Observable<Material[]> {
    const params: Record<string, string | number> = { marcaId };
    if (categoriaId) {
      params['categoriaId'] = categoriaId;
    }
    return this.http
      .get<ApiResponse<Material[]>>(`${BASE_URL}/materiales`, { params })
      .pipe(map((res) => res.data));
  }

  listarCategoriasMercado(): Observable<CategoriaProductoMercado[]> {
    return this.http
      .get<ApiResponse<CategoriaProductoMercado[]>>(`${BASE_URL}/categorias-mercado`)
      .pipe(map((res) => res.data));
  }

  listarRegiones(): Observable<Region[]> {
    return this.http.get<ApiResponse<Region[]>>(`${BASE_URL}/regiones`).pipe(map((res) => res.data));
  }

  crearRegion(request: RegionRequest): Observable<Region> {
    return this.http.post<ApiResponse<Region>>(`${BASE_URL}/regiones`, request).pipe(map((res) => res.data));
  }

  actualizarRegion(id: number, request: RegionRequest): Observable<Region> {
    return this.http.put<ApiResponse<Region>>(`${BASE_URL}/regiones/${id}`, request).pipe(map((res) => res.data));
  }

  cambiarEstadoRegion(id: number, activo: boolean): Observable<Region> {
    return this.http
      .patch<ApiResponse<Region>>(`${BASE_URL}/regiones/${id}/estado`, { activo })
      .pipe(map((res) => res.data));
  }
}
