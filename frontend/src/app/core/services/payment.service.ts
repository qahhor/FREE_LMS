import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PagedResponse,
  Payment,
  CreatePaymentRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createPayment(request: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<ApiResponse<Payment>>(this.apiUrl, request)
      .pipe(map(res => res.data));
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<ApiResponse<Payment>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getMyPayments(page = 0, size = 20): Observable<PagedResponse<Payment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Payment>>>(`${this.apiUrl}/my`, { params })
      .pipe(map(res => res.data));
  }

  completePayment(id: number, transactionId?: string): Observable<Payment> {
    let params = new HttpParams();
    if (transactionId) {
      params = params.set('transactionId', transactionId);
    }

    return this.http.post<ApiResponse<Payment>>(`${this.apiUrl}/${id}/complete`, null, { params })
      .pipe(map(res => res.data));
  }

  refundPayment(id: number, reason: string): Observable<Payment> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<ApiResponse<Payment>>(`${this.apiUrl}/${id}/refund`, null, { params })
      .pipe(map(res => res.data));
  }
}
