import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PagedResponse,
  Enrollment,
  EnrollRequest,
  UpdateProgressRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private readonly apiUrl = `${environment.apiUrl}/enrollments`;

  constructor(private http: HttpClient) {}

  enroll(request: EnrollRequest): Observable<Enrollment> {
    return this.http.post<ApiResponse<Enrollment>>(this.apiUrl, request)
      .pipe(map(res => res.data));
  }

  getMyEnrollments(page = 0, size = 20): Observable<PagedResponse<Enrollment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Enrollment>>>(`${this.apiUrl}/my`, { params })
      .pipe(map(res => res.data));
  }

  getMyActiveEnrollments(page = 0, size = 20): Observable<PagedResponse<Enrollment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Enrollment>>>(`${this.apiUrl}/my/active`, { params })
      .pipe(map(res => res.data));
  }

  getMyCompletedEnrollments(page = 0, size = 20): Observable<PagedResponse<Enrollment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Enrollment>>>(`${this.apiUrl}/my/completed`, { params })
      .pipe(map(res => res.data));
  }

  getRecentEnrollments(size = 5): Observable<PagedResponse<Enrollment>> {
    const params = new HttpParams().set('size', size.toString());
    return this.http.get<ApiResponse<PagedResponse<Enrollment>>>(`${this.apiUrl}/my/recent`, { params })
      .pipe(map(res => res.data));
  }

  getEnrollmentById(id: number): Observable<Enrollment> {
    return this.http.get<ApiResponse<Enrollment>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getEnrollmentByCourse(courseId: number): Observable<Enrollment> {
    return this.http.get<ApiResponse<Enrollment>>(`${this.apiUrl}/course/${courseId}`)
      .pipe(map(res => res.data));
  }

  checkEnrollment(courseId: number): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check/${courseId}`)
      .pipe(map(res => res.data));
  }

  updateProgress(enrollmentId: number, request: UpdateProgressRequest): Observable<Enrollment> {
    return this.http.put<ApiResponse<Enrollment>>(`${this.apiUrl}/${enrollmentId}/progress`, request)
      .pipe(map(res => res.data));
  }

  dropEnrollment(enrollmentId: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${enrollmentId}/drop`, {})
      .pipe(map(() => undefined));
  }
}
