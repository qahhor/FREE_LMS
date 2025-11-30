import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  ApiResponse,
  PagedResponse,
  User,
  UserRole,
  UpdateUserRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getAllUsers(page = 0, size = 20): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<User>>>(this.apiUrl, { params })
      .pipe(map(res => res.data));
  }

  getUsersByRole(role: UserRole, page = 0, size = 20): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<User>>>(`${this.apiUrl}/role/${role}`, { params })
      .pipe(map(res => res.data));
  }

  getUsersByOrganization(organizationId: number, page = 0, size = 20): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<User>>>(`${this.apiUrl}/organization/${organizationId}`, { params })
      .pipe(map(res => res.data));
  }

  searchUsers(query: string, page = 0, size = 20): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<User>>>(`${this.apiUrl}/search`, { params })
      .pipe(map(res => res.data));
  }

  updateCurrentUser(request: UpdateUserRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/me`, request)
      .pipe(map(res => res.data));
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, request)
      .pipe(map(res => res.data));
  }

  updateUserRole(id: number, role: UserRole): Observable<void> {
    const params = new HttpParams().set('role', role);
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${id}/role`, null, { params })
      .pipe(map(() => undefined));
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(map(() => undefined));
  }

  activateUser(id: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(map(() => undefined));
  }

  getLeaderboard(role: UserRole = UserRole.STUDENT, size = 10): Observable<PagedResponse<User>> {
    const params = new HttpParams()
      .set('role', role)
      .set('size', size.toString());

    return this.http.get<ApiResponse<PagedResponse<User>>>(`${this.apiUrl}/leaderboard`, { params })
      .pipe(map(res => res.data));
  }
}
