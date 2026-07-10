import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

const BASE_URL = `${environment.apiBaseUrl}/archivos`;

interface ArchivoResponse {
  url: string;
}

/**
 * Sube evidencia fotográfica al backend (POST /api/v1/archivos) y devuelve
 * la URL final que se guarda en el campo "url"/"fotoUrl" correspondiente.
 */
@Injectable({ providedIn: 'root' })
export class ArchivoUploadService {
  constructor(private readonly http: HttpClient) {}

  subir(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<ArchivoResponse>>(BASE_URL, formData)
      .pipe(map((res) => res.data.url));
  }

  urlAbsoluta(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const origen = environment.apiBaseUrl.replace(/\/api\/v1$/, '');
    return `${origen}${url}`;
  }
}
