import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Usuario } from '../models/usuario.model';

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
}
