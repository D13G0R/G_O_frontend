import { HttpClient, HttpHandler, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Appointment } from '../../model/interfaces';
import { AuthService } from '../../service/Auth/auth.service'
import { TokenService } from '../../service/token/token'
import { Observable } from 'rxjs';
import { AppointmentCreate } from '../../model/interfaces'
@Injectable({
  providedIn: 'root',
})

export class AppointmentsService {
  readonly URL_API = 'http://localhost:8080/appointments';

  appointments = signal<Appointment[]>([]);

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  getAppointments(businessId: number | null) {

    const token = this.tokenService.getToken();

    const headers = new HttpHeaders({
      "Authorization": `Bearer ${ token }`
    })

    return this.http.get<Appointment[]>(`${ this.URL_API }/get/${ businessId }`, { headers });

  }

  createAppointment(payload: AppointmentCreate): Observable<any> {

    const token = this.tokenService.getToken();

    const headers = new HttpHeaders({
      "Authorization": `Bearer ${ token }`
    })

    return this.http.post<AppointmentCreate>(`${ this.URL_API }/create`, payload, { headers })

  }
}
