import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ApiResponse, Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  getRootCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/root`)
      .pipe(map(res => res.data));
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/slug/${slug}`)
      .pipe(map(res => res.data));
  }

  getSubcategories(parentId: number): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/${parentId}/subcategories`)
      .pipe(map(res => res.data));
  }

  createCategory(name: string, description?: string, parentId?: number, iconUrl?: string, color?: string): Observable<Category> {
    const params: any = { name };
    if (description) params.description = description;
    if (parentId) params.parentId = parentId;
    if (iconUrl) params.iconUrl = iconUrl;
    if (color) params.color = color;

    return this.http.post<ApiResponse<Category>>(this.apiUrl, null, { params })
      .pipe(map(res => res.data));
  }

  updateCategory(id: number, name?: string, description?: string, iconUrl?: string, color?: string): Observable<Category> {
    const params: any = {};
    if (name) params.name = name;
    if (description) params.description = description;
    if (iconUrl) params.iconUrl = iconUrl;
    if (color) params.color = color;

    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, null, { params })
      .pipe(map(res => res.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
