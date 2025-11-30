import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ApiResponse, CurrencyRate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly apiUrl = `${environment.apiUrl}/currency`;

  constructor(private http: HttpClient) {}

  getAllRates(): Observable<CurrencyRate[]> {
    return this.http.get<ApiResponse<CurrencyRate[]>>(`${this.apiUrl}/rates`)
      .pipe(map(res => res.data));
  }

  getRateByCode(code: string): Observable<CurrencyRate> {
    return this.http.get<ApiResponse<CurrencyRate>>(`${this.apiUrl}/rates/${code}`)
      .pipe(map(res => res.data));
  }

  getRatesByDate(date: string): Observable<CurrencyRate[]> {
    return this.http.get<ApiResponse<CurrencyRate[]>>(`${this.apiUrl}/rates/date/${date}`)
      .pipe(map(res => res.data));
  }

  getRateByCodeAndDate(code: string, date: string): Observable<CurrencyRate> {
    return this.http.get<ApiResponse<CurrencyRate>>(`${this.apiUrl}/rates/${code}/date/${date}`)
      .pipe(map(res => res.data));
  }

  convertToUzs(code: string, amount: number): Observable<number> {
    const params = new HttpParams()
      .set('code', code)
      .set('amount', amount.toString());

    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/convert/to-uzs`, { params })
      .pipe(map(res => res.data));
  }

  convertFromUzs(code: string, amount: number): Observable<number> {
    const params = new HttpParams()
      .set('code', code)
      .set('amount', amount.toString());

    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/convert/from-uzs`, { params })
      .pipe(map(res => res.data));
  }
}
