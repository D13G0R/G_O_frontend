import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary } from '../../model/interfaces';
import { TokenService } from '../../service/token/token';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly URL_API = 'http://localhost:8080/dashboard';

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.URL_API}/summary`, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
  }
}
