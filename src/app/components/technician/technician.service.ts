import { Injectable, OnInit,  } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Technician } from './technician';
import { Observable } from 'rxjs';
import { TokenService } from '../../service/token/token';
import { signal } from '@angular/core';
import { TechnicianInterface } from '../../model/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TechnicianService{
  
  readonly URL_API = "http://localhost:8080/technicians";

  private technicianList = signal<TechnicianInterface[]>([]);

  technicians = this.technicianList.asReadonly();

  constructor(private http: HttpClient, private token: TokenService) {}

  getTechnicians() {

    const token = this.token.getToken()

    const headers = new HttpHeaders({
      "Authorization" : `Bearer ${token}`
    })

    this.http.get<TechnicianInterface[]>(`${this.URL_API}/get`, { headers } ).subscribe(data => {
      this.technicianList.set(data)
    })
  
  }

}
