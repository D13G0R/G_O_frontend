import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { AuthService } from '../../service/Auth/auth.service';
import { ToastMessage } from '../toast-message/toast-message';
import { FormControl, FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TokenService } from '../../service/token/token';
import { Appointment, AppointmentCreate, AppointmentUpdateInterface } from '../../model/interfaces';
import { Dashboard } from '../dashboard/dashboard';
import { TechnicianService } from '../technician/technician.service';
import { App } from '../../app';

@Component({
  selector: 'app-appointments',
  imports: [ToastMessage, ɵInternalFormsSharedModule, ReactiveFormsModule, Dashboard],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
})
export class Appointments implements OnInit {
  
  showModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedAppointment: Appointment | null = null;
  errorAppointment: boolean = false;
  errorMessageAppointment: string = "";
  
  editAppointmentGroup: FormGroup;
  appointmentGroup: FormGroup;
  
  private technicianService = inject(TechnicianService)
  technicians = this.technicianService.technicians;
  
  constructor(public appointmentsService: AppointmentsService, private authService: AuthService, private tokenService: TokenService, private fb: FormBuilder) {
    
    this.appointmentGroup = this.fb.group({
      
      customerPhone: [''],
      customerName: [''],
      applianceType: [''],
      problemDescription: [''],
      address: [''],
      appointmentDate: [''],
      appointmentTime: [''],
      status: [''],
      technicianId: ['']
    });
    
    this.editAppointmentGroup = this.fb.group({
      customerPhone: [''],
      customerName: [''],
      applianceType: [''],
      appointmentDate: [''],
      appointmentTime: [''],
      status: [''],
      technicianId: [''],
      address: [''],
      problemDescription: ['']
    });
  }
  
  
  ngOnInit(): void {
    
    this.appointmentsService.getAppointments().subscribe({
      next: (data: Appointment[]) => {
        
        this.appointmentsService.appointments.set(data);
        
      }, error: (error) => {
        this.closeModal();
        this.errorAppointment = true;
        this.errorMessageAppointment = "Ha ocurrido un error inesperado" + error;
        
      }
    })

    this.technicianService.getTechnicians();


    
  };
  
  selectedStatusFilter = signal<string>("all");
  
  filteredAppointments = computed(() => {
    
    const currentData = this.appointmentsService.appointments();
    const currentStatusFilter = this.selectedStatusFilter();
    
    if ( currentStatusFilter === "all") {
      return currentData;
    }
  
    return currentData.filter(appointment => appointment.status === currentStatusFilter);
  })
  
  setFilteringByStatus(requiredStatusFilter: string){
    this.selectedStatusFilter.set(requiredStatusFilter);
  }


  createAppointment() {
    
    const payload: AppointmentCreate = {
      
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
        this.closeModal();
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
    
    const idToDelete = this.selectedAppointment.id;
    
    this.appointmentsService.deleteAppointment(idToDelete).subscribe({
      next: () => {
        
        this.appointmentsService.appointments.update(currentAppointments => 
          currentAppointments.filter(appointment => appointment.id !== idToDelete)
        )

        this.closeDeleteModal();
      },
      error: (error) => {
        this.errorAppointment = true;
        this.errorMessageAppointment = "No se pudo eliminar la cita" + error;
      }
    })

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

  //---FILTERS---

  filters = [
  { value: 'all', label: 'Todos', activeClass: 'bg-gray-900 text-white border-gray-900' },
  { value: 'scheduled', label: 'Programadas', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' },
  { value: 'confirmed', label: 'Confirmadas', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100' },
  { value: 'cancelled', label: 'Canceladas', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100' }
];
}
