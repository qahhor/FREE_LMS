import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Payment,
  CreatePaymentRequest,
  PaymentMethod,
  Invoice,
  PaymentIntentResponse,
  PaymentStats
} from '../models/payment.models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  createPayment(data: CreatePaymentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(this.apiUrl, data);
  }

  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  getUserPayments(): Observable<{ payments: Payment[] }> {
    return this.http.get<{ payments: Payment[] }>(`${this.apiUrl}/user/me`);
  }

  confirmPayment(paymentId: number, data: any): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/${paymentId}/confirm`, data);
  }

  cancelPayment(paymentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${paymentId}/cancel`, {});
  }

  // Payment Methods
  getPaymentMethods(): Observable<{ methods: PaymentMethod[] }> {
    return this.http.get<{ methods: PaymentMethod[] }>(`${this.apiUrl}/methods`);
  }

  addPaymentMethod(data: any): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/methods`, data);
  }

  removePaymentMethod(methodId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/methods/${methodId}`);
  }

  setDefaultPaymentMethod(methodId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/methods/${methodId}/set-default`, {});
  }

  // Invoices
  getInvoices(): Observable<{ invoices: Invoice[] }> {
    return this.http.get<{ invoices: Invoice[] }>(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  downloadInvoice(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${id}/download`, {
      responseType: 'blob'
    });
  }

  // Stats
  getStats(): Observable<PaymentStats> {
    return this.http.get<PaymentStats>(`${this.apiUrl}/stats`);
  }

  // Gateway-specific
  createPaymePayment(amount: number, currency: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payme/create`, { amount, currency });
  }

  createClickPayment(amount: number, currency: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/click/create`, { amount, currency });
  }
}
