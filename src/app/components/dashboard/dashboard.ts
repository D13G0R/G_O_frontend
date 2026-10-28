import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../model/interfaces';
import { AuthService } from '../../service/Auth/auth.service';
import { Sidebar } from '../sidebar/sidebar';
import { DashboardService } from './dashboard.service';

interface AppointmentStatusCard {
  readonly label: string;
  readonly value: number;
  readonly icon: string;
  readonly tone: string;
}

const AUTO_REFRESH_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  private refreshTimerId: number | null = null;

  private updatePulseTimerId: number | null = null;

  readonly updatePulse = signal(false);

  private readonly refreshWhenVisible = (): void => {
    if (document.visibilityState === 'visible') {
      this.loadSummary();
    }
  };

  private readonly refreshOnFocus = (): void => {
    this.loadSummary();
  };

  readonly summary = signal<DashboardSummary | null>(null);

  readonly loading = signal(false);

  readonly loadError = signal('');

  readonly lastUpdated = signal<Date | null>(null);

  readonly userName = this.authService.getUserName();

  readonly todayLabel = this.buildTodayLabel();

  readonly statusCards = computed<readonly AppointmentStatusCard[]>(() => {
    const summary = this.summary();

    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Programadas',
        value: summary.todayScheduledAppointments,
        icon: 'event',
        tone: 'bg-primary-fixed/60 text-primary',
      },
      {
        label: 'Confirmadas',
        value: summary.todayConfirmedAppointments,
        icon: 'event_available',
        tone: 'bg-tertiary-container/50 text-tertiary',
      },
      {
        label: 'En curso',
        value: summary.todayInProgressAppointments,
        icon: 'timer',
        tone: 'bg-secondary-container/60 text-secondary',
      },
      {
        label: 'Por cobrar',
        value: summary.todayPendingPaymentAppointments,
        icon: 'request_quote',
        tone: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Pago en revisión',
        value: summary.todayPaymentReviewAppointments,
        icon: 'fact_check',
        tone: 'bg-primary-fixed/40 text-primary',
      },
      {
        label: 'Pago rechazado',
        value: summary.todayPaymentRejectedAppointments,
        icon: 'cancel',
        tone: 'bg-error-container/50 text-error',
      },
      {
        label: 'Completadas',
        value: summary.todayCompletedAppointments,
        icon: 'task_alt',
        tone: 'bg-tertiary-container/40 text-tertiary',
      },
      {
        label: 'Canceladas',
        value: summary.todayCancelledAppointments,
        icon: 'block',
        tone: 'bg-error-container/40 text-error',
      },
      {
        label: 'Otros',
        value: summary.todayOtherAppointments,
        icon: 'help',
        tone: 'bg-surface-container text-on-surface-variant',
      },
    ];
  });

  ngOnInit(): void {
    this.loadSummary();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadSummary(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set('');

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
        this.pulseUpdate();
      },
      error: (error) => {
        this.loading.set(false);
        this.loadError.set(
          error?.error?.message || 'No se pudieron cargar las métricas del dashboard.',
        );
      },
    });
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  formatTime(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }

  private startAutoRefresh(): void {
    if (this.refreshTimerId !== null) {
      return;
    }

    this.refreshTimerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadSummary();
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    document.addEventListener('visibilitychange', this.refreshWhenVisible);
    window.addEventListener('focus', this.refreshOnFocus);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimerId !== null) {
      window.clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    if (this.updatePulseTimerId !== null) {
      window.clearTimeout(this.updatePulseTimerId);
      this.updatePulseTimerId = null;
    }

    document.removeEventListener('visibilitychange', this.refreshWhenVisible);
    window.removeEventListener('focus', this.refreshOnFocus);
  }

  private pulseUpdate(): void {
    this.updatePulse.set(true);

    if (this.updatePulseTimerId !== null) {
      window.clearTimeout(this.updatePulseTimerId);
    }

    this.updatePulseTimerId = window.setTimeout(() => {
      this.updatePulse.set(false);
      this.updatePulseTimerId = null;
    }, 1_200);
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
