import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Appointment, PaymentEvent } from '../../model/interfaces';
import { AuthService } from '../../service/Auth/auth.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PaymentService } from '../../service/payments/payment.service';
import { PaymentRealtimeService } from '../../service/payments/payment-realtime.service';

export type AppointmentTab = 'all' | 'scheduled' | 'confirmed' | 'cancelled' | 'payments';

interface AppointmentTabDefinition {
  readonly id: AppointmentTab;
  readonly label: string;
}

interface StopwatchState {
  readonly startedAt: number | null;
  readonly accumulatedMs: number;
}

interface StatusPresentation {
  readonly label: string;
  readonly dotClass: string;
  readonly textClass: string;
}

interface PaymentPresentation {
  readonly label: string;
  readonly badgeClass: string;
}

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Component({
  selector: 'app-technician-mobile',
  imports: [],
  templateUrl: './technician-mobile.html',
  styleUrl: './technician-mobile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicianMobile implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly paymentService = inject(PaymentService);
  private readonly realtimeService = inject(PaymentRealtimeService);

  readonly appointments = signal<Appointment[]>([]);

  readonly tabs: readonly AppointmentTabDefinition[] = [
    { id: 'all', label: 'Todas' },
    { id: 'scheduled', label: 'Programadas' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'cancelled', label: 'Canceladas' },
    { id: 'payments', label: 'Pagos' },
  ];

  readonly selectedTab = signal<AppointmentTab>('all');

  readonly tabCounts = computed<Record<AppointmentTab, number>>(() => {
    const appointments = this.appointments();

    return {
      all: appointments.length,
      scheduled: appointments.filter((appointment) => this.normalizeStatus(appointment.status) === 'scheduled').length,
      confirmed: appointments.filter((appointment) => this.normalizeStatus(appointment.status) === 'confirmed').length,
      cancelled: appointments.filter((appointment) => this.normalizeStatus(appointment.status) === 'cancelled').length,
      payments: appointments.filter((appointment) => this.hasPaymentActivity(appointment)).length,
    };
  });

  readonly displayedAppointments = computed(() => {
    const appointments = this.appointments();
    const tab = this.selectedTab();

    if (tab === 'all') {
      return appointments;
    }

    if (tab === 'payments') {
      return appointments.filter((appointment) => this.hasPaymentActivity(appointment));
    }

    return appointments.filter((appointment) => this.normalizeStatus(appointment.status) === tab);
  });

  readonly loading = signal(false);

  readonly loadError = signal('');

  readonly isOnShift = signal(true);

  readonly todayLabel = this.buildTodayLabel();

  readonly displayName = computed(() => this.authService.getUserName());

  readonly isTechnician = computed(() => this.authService.isTechnician());

  readonly completedCount = computed(
    () =>
      this.appointments().filter(
        (appointment) =>
          appointment.paymentStatus === 'APPROVED' ||
          this.normalizeStatus(appointment.status) === 'completed',
      ).length,
  );

  readonly runningCount = computed(() => {
    let running = 0;
    for (const state of this.stopwatches().values()) {
      if (state.startedAt !== null) {
        running++;
      }
    }
    return running;
  });

  readonly finishTarget = signal<Appointment | null>(null);

  readonly detailTarget = signal<Appointment | null>(null);

  readonly amountInput = signal('');

  readonly paymentMethodInput = signal('cash');

  readonly referenceInput = signal('');

  readonly evidenceFileName = signal('');

  readonly evidenceError = signal('');

  readonly submittingPayment = signal(false);

  readonly submitPaymentError = signal('');

  readonly successMessage = signal('');

  private readonly now = signal(Date.now());

  private readonly stopwatches = signal<ReadonlyMap<number, StopwatchState>>(new Map());

  private tickerId: number | null = null;

  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  private evidenceFile: File | null = null;

  private realtimeSubscription: Subscription | null = null;

  private readonly statusPresentation: Readonly<Record<string, StatusPresentation>> = {
    scheduled: {
      label: 'Programada',
      dotClass: 'bg-primary-container',
      textClass: 'text-primary',
    },
    confirmed: {
      label: 'Confirmada',
      dotClass: 'bg-tertiary',
      textClass: 'text-tertiary',
    },
    cancelled: {
      label: 'Cancelada',
      dotClass: 'bg-error',
      textClass: 'text-error',
    },
    completed: {
      label: 'Completada',
      dotClass: 'bg-tertiary',
      textClass: 'text-tertiary',
    },
    payment_review: {
      label: 'Pago en revisión',
      dotClass: 'bg-primary-container',
      textClass: 'text-primary',
    },
    payment_rejected: {
      label: 'Pago rechazado',
      dotClass: 'bg-error',
      textClass: 'text-error',
    },
  };

  private readonly fallbackStatus: StatusPresentation = {
    label: 'Sin estado',
    dotClass: 'bg-outline',
    textClass: 'text-on-surface-variant',
  };

  ngOnInit(): void {
    this.loadAppointments();

    this.realtimeSubscription = this.realtimeService.events.subscribe((event) => {
      this.handleRealtimeEvent(event);
    });
    this.realtimeService.connect();
  }

  ngOnDestroy(): void {
    this.clearTicker();
    this.clearSuccessTimer();
    this.realtimeSubscription?.unsubscribe();
    this.realtimeService.disconnect();
  }

  selectTab(tab: AppointmentTab): void {
    this.selectedTab.set(tab);
  }

  toggleShift(): void {
    this.isOnShift.update((onShift) => !onShift);
  }

  statusMeta(status: string): StatusPresentation {
    return this.statusPresentation[this.normalizeStatus(status)] ?? this.fallbackStatus;
  }

  paymentMeta(appointment: Appointment): PaymentPresentation | null {
    switch (appointment.paymentStatus) {
      case 'PENDING':
        return {
          label: 'Pago en validación',
          badgeClass: 'bg-primary-fixed text-primary border-primary/20',
        };
      case 'APPROVED':
        return {
          label: 'Pago aprobado',
          badgeClass: 'bg-tertiary-container/50 text-tertiary border-tertiary/20',
        };
      case 'REJECTED':
        return {
          label: 'Pago rechazado',
          badgeClass: 'bg-error-container/50 text-error border-error/20',
        };
      default:
        return null;
    }
  }

  canReportPayment(appointment: Appointment): boolean {
    if (!this.isTechnician()) {
      return false;
    }

    if (this.normalizeStatus(appointment.status) === 'cancelled') {
      return false;
    }

    return appointment.paymentStatus !== 'PENDING' && appointment.paymentStatus !== 'APPROVED';
  }

  isCompleted(appointment: Appointment): boolean {
    return this.normalizeStatus(appointment.status) === 'completed';
  }

  canStart(appointment: Appointment): boolean {
    return (
      this.isTechnician() &&
      !this.isStopwatchRunning(appointment.id) &&
      this.normalizeStatus(appointment.status) !== 'cancelled' &&
      appointment.paymentStatus !== 'PENDING' &&
      appointment.paymentStatus !== 'APPROVED'
    );
  }

  formatTime(time: string): string {
    if (!time) {
      return '';
    }

    const [hoursPart, minutesPart] = time.split(':');
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart ?? 0);

    if (Number.isNaN(hours)) {
      return time;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const twelveHour = hours % 12 || 12;
    const safeMinutes = Number.isNaN(minutes) ? 0 : minutes;

    return `${String(twelveHour).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')} ${period}`;
  }

  formatDate(date: string): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(parsedDate);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }

  isStopwatchRunning(appointmentId: number): boolean {
    return this.stopwatches().get(appointmentId)?.startedAt != null;
  }

  elapsedMs(appointmentId: number): number {
    const state = this.stopwatches().get(appointmentId);

    if (!state) {
      return 0;
    }

    return state.accumulatedMs + (state.startedAt === null ? 0 : this.now() - state.startedAt);
  }

  startStopwatch(appointmentId: number): void {
    const currentStopwatches = this.stopwatches();
    const currentState = currentStopwatches.get(appointmentId);

    if (currentState?.startedAt != null) {
      return;
    }

    const nextStopwatches = new Map(currentStopwatches);
    nextStopwatches.set(appointmentId, {
      startedAt: Date.now(),
      accumulatedMs: currentState?.accumulatedMs ?? 0,
    });
    this.stopwatches.set(nextStopwatches);
    this.ensureTicker();
  }

  stopStopwatch(appointmentId: number): void {
    const currentStopwatches = this.stopwatches();
    const currentState = currentStopwatches.get(appointmentId);

    if (!currentState || currentState.startedAt === null) {
      return;
    }

    const nextStopwatches = new Map(currentStopwatches);
    nextStopwatches.set(appointmentId, {
      startedAt: null,
      accumulatedMs: currentState.accumulatedMs + Date.now() - currentState.startedAt,
    });
    this.stopwatches.set(nextStopwatches);
    this.stopTickerIfIdle(nextStopwatches);
  }

  openFinishModal(appointment: Appointment): void {
    this.finishTarget.set(appointment);
    this.amountInput.set(appointment.paymentAmount != null ? String(appointment.paymentAmount) : '');
    this.paymentMethodInput.set(appointment.paymentMethod ?? 'cash');
    this.referenceInput.set('');
    this.evidenceFile = null;
    this.evidenceFileName.set('');
    this.evidenceError.set('');
    this.submitPaymentError.set('');
    this.submittingPayment.set(false);
  }

  closeFinishModal(): void {
    if (this.submittingPayment()) {
      return;
    }

    this.finishTarget.set(null);
  }

  onAmountInput(event: Event): void {
    this.amountInput.set((event.target as HTMLInputElement).value);
    this.submitPaymentError.set('');
  }

  onMethodInput(event: Event): void {
    this.paymentMethodInput.set((event.target as HTMLSelectElement).value);
  }

  onReferenceInput(event: Event): void {
    this.referenceInput.set((event.target as HTMLInputElement).value);
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.evidenceFile = null;
    this.evidenceFileName.set('');
    this.evidenceError.set('');

    if (!file) {
      return;
    }

    if (file.size > MAX_EVIDENCE_BYTES) {
      this.evidenceError.set('El comprobante no puede superar los 10 MB.');
      input.value = '';
      return;
    }

    if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
      this.evidenceError.set('Formato no válido. Usa JPG, PNG, WEBP o PDF.');
      input.value = '';
      return;
    }

    this.evidenceFile = file;
    this.evidenceFileName.set(file.name);
  }

  submitPayment(): void {
    const appointment = this.finishTarget();

    if (!appointment || this.submittingPayment()) {
      return;
    }

    const amount = Number(this.amountInput().replace(',', '.'));

    if (!Number.isFinite(amount) || amount <= 0) {
      this.submitPaymentError.set('Ingresa un valor válido mayor que cero.');
      return;
    }

    if (!this.evidenceFile) {
      this.evidenceError.set('Adjunta la foto o PDF del comprobante de pago.');
      return;
    }

    const formData = new FormData();
    formData.append('amount', String(amount));
    formData.append('method', this.paymentMethodInput());

    const reference = this.referenceInput().trim();
    if (reference) {
      formData.append('reference', reference);
    }

    formData.append('evidence', this.evidenceFile);

    this.submittingPayment.set(true);
    this.submitPaymentError.set('');

    this.paymentService.submitPayment(appointment.id, formData).subscribe({
      next: () => {
        this.submittingPayment.set(false);
        this.stopStopwatch(appointment.id);
        this.closeFinishModal();
        this.setSuccessMessage('Pago reportado. El negocio lo validará en breve.');
        this.loadAppointments();
      },
      error: (error) => {
        this.submittingPayment.set(false);
        this.submitPaymentError.set(
          error?.error?.message || 'No se pudo reportar el pago. Inténtalo nuevamente.',
        );
      },
    });
  }

  openDetailModal(appointment: Appointment): void {
    this.detailTarget.set(appointment);
  }

  closeDetailModal(): void {
    this.detailTarget.set(null);
  }

  @HostListener('document:keydown.escape')
  closeActiveModal(): void {
    this.closeFinishModal();
    this.closeDetailModal();
  }

  replayRejected(appointment: Appointment): void {
    this.closeDetailModal();
    this.openFinishModal(appointment);
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.appointmentsService.getMyAppointments().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.loadError.set(
          error?.error?.message || 'No se pudieron cargar tus citas. Inténtalo de nuevo.',
        );
      },
    });
  }

  private handleRealtimeEvent(event: PaymentEvent): void {
    if (event.type !== 'PAYMENT_REVIEWED') {
      return;
    }

    if (event.payment.status === 'APPROVED') {
      this.setSuccessMessage('Tu pago fue aprobado. ¡Servicio completado!');
    } else {
      this.setSuccessMessage(
        `Tu pago fue rechazado. ${event.payment.observation ?? 'Revisa la observación y reenvía el comprobante.'}`,
      );
    }

    this.loadAppointments();
  }

  private normalizeStatus(status: string): string {
    const normalized = (status ?? '').trim().toLowerCase();

    return normalized === 'pending' ? 'scheduled' : normalized;
  }

  private hasPaymentActivity(appointment: Appointment): boolean {
    const status = this.normalizeStatus(appointment.status);

    return (
      appointment.paymentStatus != null ||
      status === 'payment_review' ||
      status === 'payment_rejected' ||
      status === 'completed'
    );
  }

  private setSuccessMessage(message: string): void {
    this.successMessage.set(message);
    this.clearSuccessTimer();
    this.successTimerId = setTimeout(() => {
      this.successMessage.set('');
      this.successTimerId = null;
    }, 5000);
  }

  private clearSuccessTimer(): void {
    if (this.successTimerId !== null) {
      clearTimeout(this.successTimerId);
      this.successTimerId = null;
    }
  }

  private ensureTicker(): void {
    if (this.tickerId !== null) {
      return;
    }

    this.now.set(Date.now());
    this.tickerId = window.setInterval(() => this.now.set(Date.now()), 1000);
  }

  private stopTickerIfIdle(states: ReadonlyMap<number, StopwatchState>): void {
    const hasRunningStopwatch = [...states.values()].some((state) => state.startedAt !== null);

    if (!hasRunningStopwatch) {
      this.clearTicker();
    }
  }

  private clearTicker(): void {
    if (this.tickerId === null) {
      return;
    }

    window.clearInterval(this.tickerId);
    this.tickerId = null;
  }

  private buildTodayLabel(): string {
    const formatted = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
