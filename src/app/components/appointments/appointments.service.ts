import { HttpClient, HttpHandler, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Appointment } from  '../../model/interfaces';
import { AuthService } from '../Auth/auth.service'
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})

export class AppointmentsService {
  readonly URL_API = 'http://localhost:8080/appointments';

  appointments = signal<Appointment[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) { }

  getAppointments(businessId : number | null) {

    const token = this.authService.getToken(); 

    const headers = new HttpHeaders({
      "Authorization" : `Bearer ${token}`
    })

    return this.http.get<Appointment[]>(`${this.URL_API}/${businessId}`, { headers });
    
  }
}
