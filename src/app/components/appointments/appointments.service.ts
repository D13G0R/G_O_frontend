import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {CharactersResponse, Character} from  '../../model/interfaces';


@Injectable({
  providedIn: 'root',
})

export class AppointmentsService {
  readonly URL_API = 'https://rickandmortyapi.com/api/character';

  appointments = signal<Character[]>([]);

  constructor(private http: HttpClient) { }

  getAppointments() {
    return this.http.get<CharactersResponse>(this.URL_API);
  }
}
