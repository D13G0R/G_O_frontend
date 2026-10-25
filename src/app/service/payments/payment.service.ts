import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentDecision, PaymentReview } from '../../model/interfaces';
import { TokenService } from '../token/token';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly URL_API = 'http://localhost:8080';

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  getPayments(status: string = 'ALL'): Observable<PaymentReview[]> {
    const params = new HttpParams().set('status', status);

    return this.http.get<PaymentReview[]>(`${this.URL_API}/payments`, {
      headers: this.authHeaders(),
      params,
    });
  }

  reviewPayment(paymentId: number, decision: PaymentDecision): Observable<PaymentReview> {
    return this.http.patch<PaymentReview>(
      `${this.URL_API}/payments/${paymentId}/review`,
      decision,
      { headers: this.authHeaders() },
    );
  }

  getEvidence(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.URL_API}/payments/${paymentId}/evidence`, {
      headers: this.authHeaders(),
      responseType: 'blob',
    });
  }

  submitPayment(appointmentId: number, formData: FormData): Observable<PaymentReview> {
    return this.http.post<PaymentReview>(
      `${this.URL_API}/appointments/${appointmentId}/payment`,
      formData,
      { headers: this.authHeaders() },
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
  }
}
