import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BusinessConfigurationUpdate } from '../../model/interfaces';
import { TokenService } from '../../service/token/token';

@Injectable({
  providedIn: 'root',
})
export class BusinessConfigurationService {
  private readonly URL_API = 'http://localhost:8080/business-configuration';

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  updateConfiguration(
    update: BusinessConfigurationUpdate,
  ): Observable<void> {
    const token = this.tokenService.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.patch<void>(this.URL_API, update, { headers });
  }

  getConfiguration(): Observable<BusinessConfigurationUpdate> {
    const token = this.tokenService.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<BusinessConfigurationUpdate>(this.URL_API, {
      headers,
    });
  }
}
