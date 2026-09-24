import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginPayload } from '../../model/interfaces';
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root',
})

export class LoginService {
  private readonly URL_API = "http://localhost:8080/api/auth/login"

  constructor(private httpClient: HttpClient){}

  login(payload: LoginPayload): Observable<any> {
    return this.httpClient.post(this.URL_API, payload);
  }
  
}
