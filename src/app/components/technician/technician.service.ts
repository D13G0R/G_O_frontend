import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../../service/token/token';
import { RegisterTechnicianRequest, TechnicianInterface } from '../../model/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TechnicianService {

  readonly API_BASE = 'http://localhost:8080';
  readonly URL_API = `${this.API_BASE}/technicians`;

  private technicianList = signal<TechnicianInterface[]>([]);

  technicians = this.technicianList.asReadonly();

  constructor(private http: HttpClient, private token: TokenService) {}

  getTechnicians(): void {
    this.http.get<TechnicianInterface[]>(`${this.URL_API}/get`, { headers: this.authHeaders() })
      .subscribe(data => this.technicianList.set(data));
  }

  registerTechnician(payload: RegisterTechnicianRequest, photo: File | null): Observable<TechnicianInterface> {
    const formData = new FormData();

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (photo) {
      formData.append('photo', photo, photo.name);
    }

    return this.http.post<TechnicianInterface>(`${this.URL_API}/register`, formData, {
      headers: this.authHeaders(),
    });
  }

  registerSelf(photo: File | null): Observable<TechnicianInterface> {
    const formData = new FormData();

    if (photo) {
      formData.append('photo', photo, photo.name);
    }

    return this.http.post<TechnicianInterface>(`${this.URL_API}/register/self`, formData, {
      headers: this.authHeaders(),
    });
  }

  photoUrl(photo: string | null | undefined): string | null {
    if (!photo) {
      return null;
    }

    if (/^https?:\/\//i.test(photo)) {
      return photo;
    }

    return `${this.API_BASE}/technician-photo/${photo.replace(/^\/+/, '')}`;
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token.getToken() ?? ''}`,
    });
  }
}
