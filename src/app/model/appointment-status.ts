export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'pending_payment'
  | 'payment_review'
  | 'payment_rejected'
  | 'completed'
  | 'cancelled';

const STATUS_LABELS: Readonly<Record<string, string>> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  pending_payment: 'Por cobrar',
  payment_review: 'Pago en revisión',
  payment_rejected: 'Pago rechazado',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function normalizeAppointmentStatus(status: string | null | undefined): string {
  const normalized = (status ?? '').trim().toLowerCase();

  return normalized === 'pending' ? 'scheduled' : normalized;
}

export function appointmentStatusLabel(status: string | null | undefined): string {
  return STATUS_LABELS[normalizeAppointmentStatus(status)] ?? 'Sin estado';
}
