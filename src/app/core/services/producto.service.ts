import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ProductoLocal, SincronizacionProductosResultado } from '../models/producto.model';

const PRODUCTOS_URL = `${environment.apiBaseUrl}/productos`;

@Injectable({ providedIn: 'root' })
export class ProductoService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<ProductoLocal[]> {
    return this.http.get<ApiResponse<ProductoLocal[]>>(PRODUCTOS_URL).pipe(map((res) => res.data));
  }

  sincronizar(): Observable<SincronizacionProductosResultado> {
    return this.http
      .post<ApiResponse<SincronizacionProductosResultado>>(`${PRODUCTOS_URL}/sincronizar`, {})
      .pipe(map((res) => res.data));
  }
}
