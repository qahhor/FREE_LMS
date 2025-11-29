import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PagedResponse,
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  CourseFilter
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  getCourses(page = 0, size = 20): Observable<PagedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Course>>>(this.apiUrl, { params })
      .pipe(map(res => res.data));
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getCourseBySlug(slug: string): Observable<Course> {
    return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/slug/${slug}`)
      .pipe(map(res => res.data));
  }

  searchCourses(query: string, page = 0, size = 20): Observable<PagedResponse<Course>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Course>>>(`${this.apiUrl}/search`, { params })
      .pipe(map(res => res.data));
  }

  filterCourses(filter: CourseFilter, page = 0, size = 20): Observable<PagedResponse<Course>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filter.categoryId) params = params.set('categoryId', filter.categoryId.toString());
    if (filter.level) params = params.set('level', filter.level);
    if (filter.minPrice !== undefined) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter.language) params = params.set('language', filter.language);
    if (filter.instructorId) params = params.set('instructorId', filter.instructorId.toString());
    if (filter.isFeatured !== undefined) params = params.set('isFeatured', filter.isFeatured.toString());

    return this.http.get<ApiResponse<PagedResponse<Course>>>(`${this.apiUrl}/filter`, { params })
      .pipe(map(res => res.data));
  }

  getPopularCourses(size = 10): Observable<Course[]> {
    const params = new HttpParams().set('size', size.toString());
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/popular`, { params })
      .pipe(map(res => res.data));
  }

  getRecentCourses(size = 10): Observable<Course[]> {
    const params = new HttpParams().set('size', size.toString());
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/recent`, { params })
      .pipe(map(res => res.data));
  }

  getFeaturedCourses(size = 10): Observable<Course[]> {
    const params = new HttpParams().set('size', size.toString());
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/featured`, { params })
      .pipe(map(res => res.data));
  }

  getCoursesByCategory(categoryId: number, page = 0, size = 20): Observable<PagedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Course>>>(`${this.apiUrl}/category/${categoryId}`, { params })
      .pipe(map(res => res.data));
  }

  getCoursesByInstructor(instructorId: number, page = 0, size = 20): Observable<PagedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<Course>>>(`${this.apiUrl}/instructor/${instructorId}`, { params })
      .pipe(map(res => res.data));
  }

  createCourse(request: CreateCourseRequest): Observable<Course> {
    return this.http.post<ApiResponse<Course>>(this.apiUrl, request)
      .pipe(map(res => res.data));
  }

  updateCourse(id: number, request: UpdateCourseRequest): Observable<Course> {
    return this.http.put<ApiResponse<Course>>(`${this.apiUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  publishCourse(id: number): Observable<Course> {
    return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/${id}/publish`, {})
      .pipe(map(res => res.data));
  }

  archiveCourse(id: number): Observable<Course> {
    return this.http.post<ApiResponse<Course>>(`${this.apiUrl}/${id}/archive`, {})
      .pipe(map(res => res.data));
  }
}
