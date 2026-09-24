import { Component, OnInit, signal } from '@angular/core';
import { AppointmentsService } from './appointments.service';

@Component({
  selector: 'app-appointments',
  imports: [],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
})
export class Appointments implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  constructor(public appointmentsService: AppointmentsService) {}

  ngOnInit(): void {
    this.getAppointments();
  }

  getAppointments() {
    this.appointmentsService.getAppointments().subscribe({
      next: (data) => {
        this.appointmentsService.appointments.set(
          Array.isArray(data) ? data : data.results,
        );
        this.loading.set(false);
      },
      error: (error) => {
        console.error('No se pudieron cargar los personajes', error);
        this.loading.set(false);
        this.errorMessage.set('No se pudieron cargar los personajes.');
      },
    });
  }

}
