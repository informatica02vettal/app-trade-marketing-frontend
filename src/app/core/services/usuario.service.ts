import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Usuario, UsuarioRequest } from '../models/usuario.model';

const BASE_URL = `${environment.apiBaseUrl}/usuarios`;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<ApiResponse<Usuario[]>>(BASE_URL).pipe(map((res) => res.data));
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<ApiResponse<Usuario>>(`${BASE_URL}/${id}`).pipe(map((res) => res.data));
  }

  crear(request: UsuarioRequest): Observable<Usuario> {
    return this.http.post<ApiResponse<Usuario>>(BASE_URL, request).pipe(map((res) => res.data));
  }

  actualizar(id: number, request: UsuarioRequest): Observable<Usuario> {
    return this.http.put<ApiResponse<Usuario>>(`${BASE_URL}/${id}`, request).pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${BASE_URL}/${id}`).pipe(map(() => undefined));
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http
      .patch<ApiResponse<Usuario>>(`${BASE_URL}/${id}/estado`, { activo })
      .pipe(map((res) => res.data));
  }
}
