import {
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { AuthService } from '../../service/Auth/auth.service';
import { ToastMessage } from '../toast-message/toast-message';
import { FormControl, FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TokenService } from '../../service/token/token';
import { Appointment, AppointmentCreate, AppointmentUpdateInterface } from '../../model/interfaces';
import {
  appointmentStatusLabel,
  normalizeAppointmentStatus,
} from '../../model/appointment-status';
import { Sidebar } from '../sidebar/sidebar';
import { TechnicianService } from '../technician/technician.service';
import { App } from '../../app';

@Component({
  selector: 'app-appointments',
  imports: [ToastMessage, ɵInternalFormsSharedModule, ReactiveFormsModule, Sidebar],
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
  
  constructor(
    public appointmentsService: AppointmentsService,
    private authService: AuthService,
    private tokenService: TokenService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    
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
        this.errorMessageAppointment = "Ha ocurrido un error inesperado: " + error.error.message;
        this.changeDetectorRef.markForCheck();
        
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
  
    return currentData.filter(
      (appointment) =>
        normalizeAppointmentStatus(appointment.status) === currentStatusFilter,
    );
  })
  
  setFilteringByStatus(requiredStatusFilter: string){
    this.selectedStatusFilter.set(requiredStatusFilter);
  }

  formatBogotaTime(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(parsedDate);
  }

  statusLabel(status: string): string {
    return appointmentStatusLabel(status);
  }

  statusBadgeClass(status: string): string {
    switch (normalizeAppointmentStatus(status)) {
      case 'confirmed':
        return 'bg-tertiary-container text-on-tertiary-container';
      case 'in_progress':
        return 'bg-secondary-container text-secondary';
      case 'pending_payment':
        return 'bg-amber-100 text-amber-700';
      case 'payment_review':
        return 'bg-primary-fixed text-primary';
      case 'payment_rejected':
      case 'cancelled':
        return 'bg-error-container text-on-error-container';
      case 'completed':
        return 'bg-tertiary-container text-tertiary';
      default:
        return 'bg-primary-fixed text-primary';
    }
  }

  serviceDuration(appointment: Appointment): string {
    if (!appointment.startTime || !appointment.endTime) {
      return '';
    }

    const start = Date.parse(appointment.startTime);
    const end = Date.parse(appointment.endTime);

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return '';
    }

    const totalMinutes = Math.max(1, Math.round((end - start) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }

    return `${minutes} min`;
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
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.closeModal();
        this.errorMessageAppointment = error.error.message;
        this.errorAppointment = true;
        this.changeDetectorRef.markForCheck();
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
          this.changeDetectorRef.markForCheck();
        },
        error: (error) => {
          this.errorAppointment = true;
          this.errorMessageAppointment = "No se pudo actualizar la cita" + error;
          this.changeDetectorRef.markForCheck();
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
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.errorMessageAppointment = "No se pudo eliminar la cita: " + error.error.message;
        this.errorAppointment = true;
        this.changeDetectorRef.markForCheck();
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
    { value: 'in_progress', label: 'En curso', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' },
    { value: 'pending_payment', label: 'Por cobrar', activeClass: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100' },
    { value: 'payment_review', label: 'Pago en revisión', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' },
    { value: 'payment_rejected', label: 'Pago rechazado', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100' },
    { value: 'completed', label: 'Completadas', activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-100' },
    { value: 'cancelled', label: 'Canceladas', activeClass: 'bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-100' },
  ];
}
