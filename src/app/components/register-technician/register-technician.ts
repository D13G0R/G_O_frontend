import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterTechnicianRequest, TechnicianInterface } from '../../model/interfaces';
import { AuthService } from '../../service/Auth/auth.service';
import { TechnicianService } from '../technician/technician.service';
import { Dashboard } from '../dashboard/dashboard';

type RegistrationMode = 'owner' | 'technician';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-register-technician',
  imports: [Dashboard, ReactiveFormsModule],
  templateUrl: './register-technician.html',
  styleUrl: './register-technician.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTechnician implements OnInit, OnDestroy {
  private readonly technicianService = inject(TechnicianService);
  private readonly authService = inject(AuthService);

  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;

  readonly technicians = this.technicianService.technicians;

  readonly mode = signal<RegistrationMode>('owner');

  readonly submitting = signal(false);

  readonly successMessage = signal('');

  readonly errorMessage = signal('');

  readonly showPassword = signal(false);

  readonly selectedPhoto = signal<File | null>(null);

  readonly selectedPhotoName = signal('');

  readonly photoPreview = signal<string | null>(null);

  private readonly currentUserId = this.authService.getUserId();

  readonly ownerName = this.authService.getUserName();

  readonly ownerEmail = this.authService.getEmail() ?? 'Sin email';

  readonly ownerTechnician = computed(
    () => this.technicians().find((technician) => technician.userId === this.currentUserId) ?? null,
  );

  readonly ownerPhotoUrl = computed(() => this.technicianService.photoUrl(this.ownerTechnician()?.photo));

  readonly photoToShow = computed(
    () => this.photoPreview() ?? (this.mode() === 'owner' ? this.ownerPhotoUrl() : null),
  );

  readonly linkedCount = computed(
    () => this.technicians().filter((technician) => technician.userId != null).length,
  );

  readonly submitLabel = computed(() => {
    if (this.mode() === 'owner') {
      return this.ownerTechnician() ? 'Actualizar foto' : 'Guardar ficha de técnico';
    }

    return 'Registrar técnico';
  });

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

  ngOnDestroy(): void {
    this.revokePhotoPreview();
  }

  setMode(mode: RegistrationMode): void {
    if (this.submitting() || this.mode() === mode) {
      return;
    }

    this.mode.set(mode);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.clearSelectedPhoto();
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.errorMessage.set('');

    if (!file) {
      this.clearSelectedPhoto();
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      this.errorMessage.set('La foto debe ser JPG, PNG o WEBP.');
      this.clearSelectedPhoto();
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      this.errorMessage.set('La foto no puede superar los 5 MB.');
      this.clearSelectedPhoto();
      return;
    }

    this.revokePhotoPreview();
    this.selectedPhoto.set(file);
    this.selectedPhotoName.set(file.name);
    this.photoPreview.set(URL.createObjectURL(file));
  }

  removeSelectedPhoto(): void {
    this.clearSelectedPhoto();
  }

  clearForm(): void {
    this.form.reset();
    this.clearSelectedPhoto();
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.mode() === 'owner') {
      this.submitOwner();
      return;
    }

    this.submitTechnician();
  }

  photoUrl(photo: string | null | undefined): string {
    return this.technicianService.photoUrl(photo) ?? '';
  }

  isCurrentUser(technician: TechnicianInterface): boolean {
    return this.currentUserId != null && technician.userId === this.currentUserId;
  }

  hasError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  trackTechnician(_index: number, technician: TechnicianInterface): number {
    return technician.id;
  }

  private submitOwner(): void {
    this.submitting.set(true);

    const alreadyRegistered = this.ownerTechnician() != null;
    const needsLoginRefresh = !this.authService.hasTechnicianProfile();

    this.technicianService.registerSelf(this.selectedPhoto()).subscribe({
      next: () => {
        this.submitting.set(false);

        const message = alreadyRegistered
          ? 'Tu ficha de técnico ya estaba creada. La foto se actualizó correctamente.'
          : 'Tu ficha de técnico fue creada correctamente.';

        this.successMessage.set(
          needsLoginRefresh
            ? `${message} Cierra sesión y vuelve a entrar para activar tu vista de técnico.`
            : message,
        );

        this.clearSelectedPhoto();
        this.technicianService.getTechnicians();
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error?.error?.message || 'No se pudo guardar tu ficha de técnico. Inténtalo de nuevo.',
        );
      },
    });
  }

  private submitTechnician(): void {
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

    const payload: RegisterTechnicianRequest = {
      fullName: value.fullName.trim(),
      phoneNumber: value.phoneNumber.trim(),
      email: value.email.trim().toLowerCase(),
      idCard: value.idCard.trim(),
      password: value.password,
    };

    this.submitting.set(true);

    this.technicianService.registerTechnician(payload, this.selectedPhoto()).subscribe({
      next: (technician) => {
        this.submitting.set(false);
        this.successMessage.set(
          `${technician.fullName} ya puede iniciar sesión en la app con su email y contraseña.`,
        );
        this.form.reset();
        this.clearSelectedPhoto();
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

  private clearSelectedPhoto(): void {
    this.revokePhotoPreview();
    this.selectedPhoto.set(null);
    this.selectedPhotoName.set('');

    if (this.photoInput) {
      this.photoInput.nativeElement.value = '';
    }
  }

  private revokePhotoPreview(): void {
    const preview = this.photoPreview();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    this.photoPreview.set(null);
  }
}
