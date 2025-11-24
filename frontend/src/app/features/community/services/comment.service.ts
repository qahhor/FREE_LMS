import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Comment,
  CommentableType,
  CreateCommentDto,
  UpdateCommentDto,
  PaginatedResponse,
  LikeResponse,
} from '../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  createComment(data: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, data);
  }

  getComments(
    type: CommentableType,
    id: number,
    page: number = 1,
    limit: number = 20,
  ): Observable<PaginatedResponse<Comment>> {
    const params = new HttpParams()
      .set('type', type)
      .set('id', id.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Comment>>(this.apiUrl, { params });
  }

  getReplies(
    commentId: number,
    page: number = 1,
    limit: number = 10,
  ): Observable<PaginatedResponse<Comment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Comment>>(
      `${this.apiUrl}/${commentId}/replies`,
      { params },
    );
  }

  getCommentById(commentId: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.apiUrl}/${commentId}`);
  }

  getCommentsCount(type: CommentableType, id: number): Observable<{ count: number }> {
    const params = new HttpParams().set('type', type).set('id', id.toString());
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`, { params });
  }

  updateComment(commentId: number, data: UpdateCommentDto): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${commentId}`, data);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }

  toggleLike(commentId: number): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(
      `${this.apiUrl}/${commentId}/like`,
      {},
    );
  }

  getUserLikes(ids: number[]): Observable<number[]> {
    return this.http.post<number[]>(`${this.apiUrl}/likes/check`, { ids });
  }
}
