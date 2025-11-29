import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ApiResponse, PagedResponse, Certificate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private readonly apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  getMyCertificates(page = 0, size = 20): Observable<PagedResponse<Certificate>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Certificate>>>(`${this.apiUrl}/my`, { params })
      .pipe(map(res => res.data));
  }

  getCertificateById(id: number): Observable<Certificate> {
    return this.http.get<ApiResponse<Certificate>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getCertificateByEnrollment(enrollmentId: number): Observable<Certificate> {
    return this.http.get<ApiResponse<Certificate>>(`${this.apiUrl}/enrollment/${enrollmentId}`)
      .pipe(map(res => res.data));
  }

  verifyCertificate(certificateNumber: string): Observable<Certificate> {
    return this.http.get<ApiResponse<Certificate>>(`${this.apiUrl}/verify/${certificateNumber}`)
      .pipe(map(res => res.data));
  }
}
