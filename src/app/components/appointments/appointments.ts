import { Component, OnInit, signal } from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { AuthService } from '../Auth/auth.service';
import { ToastMessage } from '../../toast-message/toast-message';

@Component({
  selector: 'app-appointments',
  imports: [ ToastMessage ],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
})
export class Appointments implements OnInit {

  businessId: number | null = null;

  showModal: boolean = false;

  errorAppointment: boolean = false;
  errorMessageAppointment: string = "";
  

  constructor(public appointmentsService: AppointmentsService, private authService: AuthService) {}

  ngOnInit(): void {
    
    this.businessId = this.authService.getBusinessId();

    this.appointmentsService.getAppointments(this.businessId).subscribe({
      next: (data) => {

        this.appointmentsService.appointments.set(data);

      }, error: (error) => {
        this.errorAppointment = true;
        this.errorMessageAppointment = "Ha ocurrido un error inesperado" + error;

      }
    })

  }

  openModal(){
    this.showModal = true;
  }
  closeModal(){
    this.showModal = false;
  }

}
