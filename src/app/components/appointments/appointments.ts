import { Component, OnInit, signal } from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { AuthService } from '../../service/Auth/auth.service';
import { ToastMessage } from '../toast-message/toast-message';
import { FormControl, FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { TokenService } from '../../service/token/token';
import { Appointment, AppointmentCreate, AppointmentUpdateInterface } from '../../model/interfaces';
import { App } from '../../app';
@Component({
  selector: 'app-appointments',
  imports: [ToastMessage, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
})
export class Appointments implements OnInit {

  businessId: number | null = null;
  showModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedAppointment: Appointment | null = null;
  errorAppointment: boolean = false;
  errorMessageAppointment: string = "";

  editAppointmentGroup: FormGroup;
  appointmentGroup: FormGroup;
  businessIdControl: FormControl;
  sessionId: FormControl;
  customerPhone: FormControl;
  customerName: FormControl;
  applianceType: FormControl;
  problemDescription: FormControl;
  address: FormControl;
  appointmentDate: FormControl;
  appointmentTime: FormControl;
  status: FormControl;
  technicianId: FormControl;


  constructor(public appointmentsService: AppointmentsService, private authService: AuthService, private tokenService: TokenService) {

    this.businessIdControl = new FormControl("");
    this.sessionId = new FormControl("");
    this.customerPhone = new FormControl("");
    this.customerName = new FormControl("");
    this.applianceType = new FormControl("");
    this.problemDescription = new FormControl("");
    this.address = new FormControl("");
    this.appointmentDate = new FormControl("");
    this.appointmentTime = new FormControl("");
    this.status = new FormControl("");
    this.technicianId = new FormControl("");

    this.appointmentGroup = new FormGroup({
      businessId: this.businessIdControl,
      sessionId: this.sessionId,
      customerPhone: this.customerPhone,
      customerName: this.customerName,
      applianceType: this.applianceType,
      problemDescription: this.problemDescription,
      address: this.address,
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      status: this.status,
      technicianId: this.technicianId,
    })

    this.editAppointmentGroup = new FormGroup({
      customerPhone: new FormControl<string>(""),
      customerName: new FormControl<string>(""),
      applianceType: new FormControl<string>(""),
      appointmentDate: new FormControl<string>(""),
      appointmentTime: new FormControl<string>(""),
      status: new FormControl<string>(""),
      technicianId: new FormControl<number>(0),
      address: new FormControl<string>(""),
      problemDescription: new FormControl<string>("")
    });
  }

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

  createAppointment() {

    const businessId = this.authService.getBusinessId();

    if (!businessId || isNaN(businessId) || businessId <= 0) {
      throw new Error("No se puede crear la cita ¿ya te logeaste?")
    }

    alert(businessId);
    const payload: AppointmentCreate = {

      businessId: businessId,
      sessionId: "manual",
      customerPhone: this.appointmentGroup.get("customerPhone")?.value,
      customerName: this.appointmentGroup.get("customerName")?.value,
      applianceType: this.appointmentGroup.get("applianceType")?.value,
      problemDescription: this.appointmentGroup.get("problemDescription")?.value,
      address: this.appointmentGroup.get("address")?.value,
      appointmentDate: this.appointmentGroup.get("appointmentDate")?.value,
      appointmentTime: this.appointmentGroup.get("appointmentTime")?.value,
      status: this.appointmentGroup.get("status")?.value,
      technicianId: this.appointmentGroup.get("technicianId")?.value
    }

    this.appointmentsService.createAppointment(payload).subscribe({

      next: (createdAppointment: Appointment) => {

        this.appointmentsService.appointments.update(currentAppointments => [
          ...currentAppointments,
          createdAppointment
        ])

        alert("Cita creada exitosamente" + createdAppointment.id);

        this.closeModal();
        this.appointmentGroup.reset()
      },
      error: (error) => {
        this.errorAppointment = true;
        this.errorMessageAppointment = "No se pudo crear la cita";
      }
    })
  }

  UpdateAppointment(): void {

    if (!this.selectedAppointment) {
      return;
    }

    const data: AppointmentUpdateInterface = this.editAppointmentGroup.getRawValue();

    const appointment: Appointment = {
      ...this.selectedAppointment,
      ...data
    }

      this.appointmentsService.updateAppointment(appointment).subscribe({
        next: (updatedAppointment) => {

          this.appointmentsService.appointments.update(currentAppointments => 
            currentAppointments.map(appointment => appointment.id == updatedAppointment.id ? updatedAppointment : appointment
            ))
          this.closeEditModal();
        },
        error: (error) => {
          this.errorAppointment = true;
          this.errorMessageAppointment = "No se pudo actualizar la cita" + error;
        }
      })
  }

  confirmDeleteAppointment(): void {

    if (!this.selectedAppointment) {
      return;
    }

    console.log("Cita que se quiere eliminar:", this.selectedAppointment);

    this.closeDeleteModal();
  }

  //Open and close modals Create, Edit, Delete

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }
  openEditModal(appointment: Appointment): void {

    this.selectedAppointment = appointment;

    this.editAppointmentGroup.patchValue({
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      applianceType: appointment.applianceType,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      technicianId: appointment.technicianId,
      address: appointment.address,
      problemDescription: appointment.problemDescription
    });

    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAppointment = null;
  }

  openDeleteModal(appointment: Appointment): void {

    this.selectedAppointment = appointment;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedAppointment = null;
  }
}
