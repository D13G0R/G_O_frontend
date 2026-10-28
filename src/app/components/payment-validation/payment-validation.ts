import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { PaymentEvent, PaymentReview } from '../../model/interfaces';
import { PaymentService } from '../../service/payments/payment.service';
import { PaymentRealtimeService } from '../../service/payments/payment-realtime.service';
import { Sidebar } from '../sidebar/sidebar';

type PaymentFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface FilterDefinition {
  readonly id: PaymentFilter;
  readonly label: string;
}

interface StatusPresentation {
  readonly label: string;
  readonly badgeClass: string;
}

@Component({
  selector: 'app-payment-validation',
  imports: [Sidebar],
  templateUrl: './payment-validation.html',
  styleUrl: './payment-validation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentValidation implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly realtimeService = inject(PaymentRealtimeService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly payments = signal<PaymentReview[]>([]);

  readonly loading = signal(false);

  readonly loadError = signal('');

  readonly filter = signal<PaymentFilter>('ALL');

  readonly search = signal('');

  readonly reviewTarget = signal<PaymentReview | null>(null);

  readonly reviewDecision = signal<'APPROVED' | 'REJECTED'>('APPROVED');

  readonly observation = signal('');

  readonly reviewError = signal('');

  readonly reviewing = signal(false);

  readonly evidenceTarget = signal<PaymentReview | null>(null);

  readonly evidenceUrl = signal<SafeResourceUrl | null>(null);

  readonly evidencePreviewUrl = signal<string | null>(null);

  readonly evidenceContentType = signal('');

  readonly evidenceLoading = signal(false);

  readonly evidenceError = signal('');

  readonly successMessage = signal('');

  readonly filters: readonly FilterDefinition[] = [
    { id: 'ALL', label: 'Todos' },
    { id: 'PENDING', label: 'Pendientes' },
    { id: 'APPROVED', label: 'Aprobados' },
    { id: 'REJECTED', label: 'Rechazados' },
  ];

  readonly counts = computed(() => {
    const payments = this.payments();

    return {
      ALL: payments.length,
      PENDING: payments.filter((payment) => payment.status === 'PENDING').length,
      APPROVED: payments.filter((payment) => payment.status === 'APPROVED').length,
      REJECTED: payments.filter((payment) => payment.status === 'REJECTED').length,
    };
  });

  readonly approvedTotal = computed(() =>
    this.payments()
      .filter((payment) => payment.status === 'APPROVED')
      .reduce((total, payment) => total + Number(payment.amount ?? 0), 0),
  );

  readonly displayedPayments = computed(() => {
    const filter = this.filter();
    const search = this.search().trim().toLowerCase();

    return this.payments().filter((payment) => {
      const matchesFilter = filter === 'ALL' || payment.status === filter;
      const matchesSearch =
        search.length === 0 ||
        payment.customerName?.toLowerCase().includes(search) ||
        payment.technicianName?.toLowerCase().includes(search) ||
        payment.service?.toLowerCase().includes(search) ||
        payment.reference?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  });

  private realtimeSubscription: Subscription | null = null;

  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  private evidenceObjectUrl: string | null = null;

  private evidenceRequestVersion = 0;

  private readonly statusPresentation: Readonly<Record<string, StatusPresentation>> = {
    PENDING: {
      label: 'Pendiente',
      badgeClass: 'bg-primary-fixed text-primary border-primary/20',
    },
    APPROVED: {
      label: 'Aprobado',
      badgeClass: 'bg-tertiary-container/50 text-tertiary border-tertiary/20',
    },
    REJECTED: {
      label: 'Rechazado',
      badgeClass: 'bg-error-container/50 text-error border-error/20',
    },
  };

  ngOnInit(): void {
    this.loadPayments();

    this.realtimeSubscription = this.realtimeService.events.subscribe((event) => {
      this.handleRealtimeEvent(event);
    });
    this.realtimeService.connect();
  }

  ngOnDestroy(): void {
    this.realtimeSubscription?.unsubscribe();
    this.realtimeService.disconnect();
    this.clearSuccessTimer();
    this.revokeEvidenceUrl();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.paymentService.getPayments('ALL').subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.loadError.set(
          error?.error?.message || 'No se pudieron cargar los pagos. Inténtalo de nuevo.',
        );
      },
    });
  }

  selectFilter(filter: PaymentFilter): void {
    this.filter.set(filter);
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  statusMeta(status: string): StatusPresentation {
    return (
      this.statusPresentation[status] ?? {
        label: status,
        badgeClass: 'bg-surface-container text-on-surface-variant border-outline-variant',
      }
    );
  }

  openApprove(payment: PaymentReview): void {
    this.reviewTarget.set(payment);
    this.reviewDecision.set('APPROVED');
    this.observation.set('');
    this.reviewError.set('');
  }

  openReject(payment: PaymentReview): void {
    this.reviewTarget.set(payment);
    this.reviewDecision.set('REJECTED');
    this.observation.set('');
    this.reviewError.set('');
  }

  closeReviewModal(): void {
    if (this.reviewing()) {
      return;
    }

    this.reviewTarget.set(null);
    this.reviewError.set('');
  }

  onObservationInput(event: Event): void {
    this.observation.set((event.target as HTMLTextAreaElement).value);
    this.reviewError.set('');
  }

  submitReview(): void {
    const payment = this.reviewTarget();

    if (!payment || this.reviewing()) {
      return;
    }

    const decision = this.reviewDecision();
    const observation = this.observation().trim();

    if (decision === 'REJECTED' && !observation) {
      this.reviewError.set('Escribe la observación para rechazar el pago.');
      return;
    }

    this.reviewing.set(true);
    this.reviewError.set('');

    this.paymentService
      .reviewPayment(payment.id, {
        status: decision,
        observation: decision === 'REJECTED' ? observation : null,
      })
      .subscribe({
        next: (updated) => {
          this.reviewing.set(false);
          this.reviewTarget.set(null);
          this.payments.update((payments) =>
            payments.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.setSuccessMessage(
            decision === 'APPROVED'
              ? 'Pago aprobado. La cita quedó completada.'
              : 'Pago rechazado. El técnico podrá reenviar el comprobante.',
          );
        },
        error: (error) => {
          this.reviewing.set(false);
          this.reviewError.set(
            error?.error?.message || 'No se pudo procesar la revisión. Inténtalo de nuevo.',
          );
        },
      });
  }

  openEvidence(payment: PaymentReview): void {
    if (this.evidenceLoading()) {
      return;
    }

    const requestVersion = ++this.evidenceRequestVersion;

    this.evidenceTarget.set(payment);
    this.evidenceLoading.set(true);
    this.evidenceError.set('');
    this.revokeEvidenceUrl();
    this.evidenceUrl.set(null);
    this.evidencePreviewUrl.set(null);

    this.paymentService.getEvidence(payment.id).subscribe({
      next: (blob) => {
        if (requestVersion !== this.evidenceRequestVersion) {
          return;
        }

        const url = URL.createObjectURL(blob);
        this.evidenceObjectUrl = url;
        this.evidenceContentType.set(blob.type);
        this.evidencePreviewUrl.set(url);
        this.evidenceUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.evidenceLoading.set(false);
      },
      error: (error) => {
        if (requestVersion !== this.evidenceRequestVersion) {
          return;
        }

        this.evidenceLoading.set(false);
        this.evidenceError.set(
          error?.error?.message || 'No se pudo cargar el comprobante.',
        );
      },
    });
  }

  closeEvidenceModal(): void {
    this.evidenceRequestVersion++;
    this.evidenceTarget.set(null);
    this.evidenceContentType.set('');
    this.evidenceError.set('');
    this.evidenceLoading.set(false);
    this.revokeEvidenceUrl();
    this.evidenceUrl.set(null);
    this.evidencePreviewUrl.set(null);
  }

  isPdf(): boolean {
    return this.evidenceContentType().includes('pdf');
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) {
      return '$0';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsedDate);
  }

  methodLabel(method: string | null | undefined): string {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      nequi: 'Nequi',
      daviplata: 'Daviplata',
    };

    return method ? labels[method] ?? method : '—';
  }

  trackPayment(_index: number, payment: PaymentReview): number {
    return payment.id;
  }

  private handleRealtimeEvent(event: PaymentEvent): void {
    if (event.type !== 'PAYMENT_SUBMITTED') {
      return;
    }

    const evidenceWasOpen = this.evidenceTarget()?.id === event.payment.id;

    this.setSuccessMessage(
      `${event.payment.technicianName} reportó un pago de ${this.formatCurrency(event.payment.amount)}.`,
    );
    this.loadPayments();

    if (evidenceWasOpen) {
      this.closeEvidenceModal();
      this.setSuccessMessage(
        'El técnico actualizó el comprobante. Vuelve a abrirlo para revisar la nueva imagen.',
      );
    }
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

  private revokeEvidenceUrl(): void {
    if (this.evidenceObjectUrl) {
      URL.revokeObjectURL(this.evidenceObjectUrl);
      this.evidenceObjectUrl = null;
    }
  }
}
