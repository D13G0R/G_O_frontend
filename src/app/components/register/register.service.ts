import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../../model/interfaces'

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly registerUrl = 'http://localhost:8080/api/auth/register';

  constructor(private http: HttpClient) {}

  register(payload: RegisterRequest): Observable<any> {
    return this.http.post(this.registerUrl, payload);
  }
}
