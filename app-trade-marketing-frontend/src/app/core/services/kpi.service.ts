import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { KpiDashboard } from '../models/kpi.model';

const BASE_URL = `${environment.apiBaseUrl}/kpis`;

@Injectable({ providedIn: 'root' })
export class KpiService {
  constructor(private readonly http: HttpClient) {}

  obtenerDashboard(): Observable<KpiDashboard> {
    return this.http.get<ApiResponse<KpiDashboard>>(BASE_URL).pipe(map((res) => res.data));
  }
}
