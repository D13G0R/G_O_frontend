import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { BusinessConfigurationUpdate } from '../../model/interfaces';
import { Dashboard } from '../dashboard/dashboard';
import { BusinessConfigurationService } from './business-configuration.service';

@Component({
  selector: 'app-business-configuration',
  standalone: true,
  imports: [Dashboard, ReactiveFormsModule],
  templateUrl: './business-configuration.html',
  styleUrl: './business-configuration.css',
})
export class BusinessConfiguration implements OnInit {
  readonly configurationForm = new FormGroup({
    services: new FormControl('', { nonNullable: true }),
    coverageAreas: new FormControl('', { nonNullable: true }),
    workingHours: new FormControl('', { nonNullable: true }),
    businessRules: new FormControl('', { nonNullable: true }),
    systemPrompt: new FormControl('', { nonNullable: true }),
    maxParallelAppointments: new FormControl<number | null>(null, [
      Validators.min(1),
    ]),
  });

  isSaving = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly businessConfigurationService: BusinessConfigurationService,
  ) {}

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.isLoading = true;
    this.businessConfigurationService
      .getConfiguration()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (config) => {
          if (config) {
            this.configurationForm.patchValue({
              services: this.fromList(config.services),
              coverageAreas: this.fromList(config.coverageAreas),
              workingHours: this.fromWorkingHours(config.workingHours),
              businessRules: this.fromList(config.businessRules),
              systemPrompt: config.systemPrompt,
              maxParallelAppointments: config.maxParallelAppointments,
            });
            // Marcamos como pristine para que no pida guardar si no hay cambios
            this.configurationForm.markAsPristine();
          }
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar la configuración actual.';
        },
      });
  }

  private fromList(list?: string[]): string {
    return list ? list.join('\n') : '';
  }

  private fromWorkingHours(workingHours?: Record<string, string>): string {
    if (!workingHours) return '';
    return Object.entries(workingHours)
      .map(([day, hours]) => `${day}: ${hours}`)
      .join('\n');
  }

  saveConfiguration(): void {
    if (this.configurationForm.invalid || this.isSaving) {
      this.configurationForm.markAllAsTouched();
      return;
    }

    const values = this.configurationForm.getRawValue();
    const update: BusinessConfigurationUpdate = {};

    if (this.configurationForm.controls.services.dirty) {
      update.services = this.toList(values.services);
    }
    if (this.configurationForm.controls.coverageAreas.dirty) {
      update.coverageAreas = this.toList(values.coverageAreas);
    }
    if (this.configurationForm.controls.workingHours.dirty) {
      const workingHours = this.toWorkingHours(values.workingHours);
      if (workingHours === null) {
        this.errorMessage =
          'Usa el formato "Día: horario", una jornada por línea.';
        this.successMessage = '';
        return;
      }
      update.workingHours = workingHours;
    }
    if (this.configurationForm.controls.businessRules.dirty) {
      update.businessRules = this.toList(values.businessRules);
    }
    if (this.configurationForm.controls.systemPrompt.dirty) {
      update.systemPrompt = values.systemPrompt;
    }
    if (
      this.configurationForm.controls.maxParallelAppointments.dirty
      && values.maxParallelAppointments !== null
    ) {
      update.maxParallelAppointments = values.maxParallelAppointments;
    }

    if (Object.keys(update).length === 0) {
      this.errorMessage = 'Modifica al menos un campo antes de guardar.';
      this.successMessage = '';
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.businessConfigurationService
      .updateConfiguration(update)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.configurationForm.markAsPristine();
          this.successMessage = 'La configuración se guardó correctamente.';
        },
        error: () => {
          this.errorMessage =
            'No se pudo guardar la configuración. Inténtalo de nuevo.';
        },
      });
  }

  private toList(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private toWorkingHours(value: string): Record<string, string> | null {
    const entries = this.toList(value);
    const workingHours: Record<string, string> = {};

    for (const entry of entries) {
      const separator = entry.indexOf(':');
      if (separator < 1 || separator === entry.length - 1) {
        return null;
      }

      const day = entry.slice(0, separator).trim();
      const hours = entry.slice(separator + 1).trim();
      if (!day || !hours) {
        return null;
      }

      workingHours[day] = hours;
    }

    return workingHours;
  }
}
