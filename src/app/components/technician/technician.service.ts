import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../../service/token/token';
import { RegisterTechnicianRequest, TechnicianInterface } from '../../model/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TechnicianService {

  readonly URL_API = 'http://localhost:8080/technicians';

  private technicianList = signal<TechnicianInterface[]>([]);

  technicians = this.technicianList.asReadonly();

  constructor(private http: HttpClient, private token: TokenService) {}

  getTechnicians(): void {
    this.http.get<TechnicianInterface[]>(`${this.URL_API}/get`, { headers: this.authHeaders() })
      .subscribe(data => this.technicianList.set(data));
  }

  registerTechnician(payload: RegisterTechnicianRequest): Observable<TechnicianInterface> {
    return this.http.post<TechnicianInterface>(`${this.URL_API}/register`, payload, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token.getToken() ?? ''}`,
    });
  }
}
