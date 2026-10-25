import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TechnicianInterface, RegisterTechnicianRequest } from '../../model/interfaces';
import { TechnicianService } from '../technician/technician.service';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-register-technician',
  imports: [Dashboard, ReactiveFormsModule],
  templateUrl: './register-technician.html',
  styleUrl: './register-technician.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTechnician implements OnInit {
  private readonly technicianService = inject(TechnicianService);

  readonly technicians = this.technicianService.technicians;

  readonly submitting = signal(false);

  readonly successMessage = signal('');

  readonly errorMessage = signal('');

  readonly showPassword = signal(false);

  readonly linkedCount = computed(
    () => this.technicians().filter((technician) => technician.userId != null).length,
  );

  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    idCard: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(16)],
    }),
    photo: new FormControl('', { nonNullable: true }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.technicianService.getTechnicians();
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa todos los campos correctamente.');
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.submitting.set(true);

    const payload:  RegisterTechnicianRequest = {
      
        fullName: value.fullName.trim(),
        phoneNumber: value.phoneNumber.trim(),
        email: value.email.trim().toLowerCase(),
        idCard: value.idCard.trim(),
        photo: value.photo.trim() || null,
        password: value.password,
      }
    

    this.technicianService.registerTechnician(payload).subscribe({
        next: (technician) => {
          this.submitting.set(false);
          this.successMessage.set(
            `${technician.fullName} ya puede iniciar sesión en la app con su email y contraseña.`,
          );
          this.form.reset();
          this.technicianService.getTechnicians();
        },
        error: (error) => {
          this.submitting.set(false);
          this.errorMessage.set(
            error?.error?.message || 'No se pudo registrar el técnico. Inténtalo de nuevo.',
          );
        },
      });
  }

  hasError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  trackTechnician(_index: number, technician: TechnicianInterface): number {
    return technician.id;
  }
}
