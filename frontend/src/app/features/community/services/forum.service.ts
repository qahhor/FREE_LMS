import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ForumCategory,
  ForumTopic,
  ForumPost,
  CreateTopicDto,
  UpdateTopicDto,
  CreatePostDto,
  UpdateContentDto,
  PaginatedResponse,
  LikeResponse,
  LikeableType,
  Tag,
} from '../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private readonly apiUrl = `${environment.apiUrl}/forum`;

  constructor(private http: HttpClient) {}

  // ===== CATEGORIES =====

  getAllCategories(): Observable<ForumCategory[]> {
    return this.http.get<ForumCategory[]>(`${this.apiUrl}/categories`);
  }

  getCategoryBySlug(slug: string): Observable<ForumCategory> {
    return this.http.get<ForumCategory>(`${this.apiUrl}/categories/${slug}`);
  }

  createCategory(data: any): Observable<ForumCategory> {
    return this.http.post<ForumCategory>(`${this.apiUrl}/categories`, data);
  }

  // ===== TOPICS =====

  createTopic(data: CreateTopicDto): Observable<ForumTopic> {
    return this.http.post<ForumTopic>(`${this.apiUrl}/topics`, data);
  }

  getTopicsByCategory(
    categoryId: number,
    page: number = 1,
    limit: number = 20,
  ): Observable<PaginatedResponse<ForumTopic>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<ForumTopic>>(
      `${this.apiUrl}/categories/${categoryId}/topics`,
      { params },
    );
  }

  searchTopics(
    query: string,
    categoryId?: number,
    tags?: string[],
    page: number = 1,
    limit: number = 20,
  ): Observable<PaginatedResponse<ForumTopic>> {
    let params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (categoryId) {
      params = params.set('category', categoryId.toString());
    }

    if (tags && tags.length > 0) {
      params = params.set('tags', tags.join(','));
    }

    return this.http.get<PaginatedResponse<ForumTopic>>(
      `${this.apiUrl}/topics/search`,
      { params },
    );
  }

  getTopicBySlug(slug: string): Observable<ForumTopic> {
    return this.http.get<ForumTopic>(`${this.apiUrl}/topics/${slug}`);
  }

  updateTopic(topicId: number, data: UpdateTopicDto): Observable<ForumTopic> {
    return this.http.put<ForumTopic>(`${this.apiUrl}/topics/${topicId}`, data);
  }

  deleteTopic(topicId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/topics/${topicId}`);
  }

  pinTopic(topicId: number, isPinned: boolean): Observable<ForumTopic> {
    return this.http.put<ForumTopic>(`${this.apiUrl}/topics/${topicId}/pin`, {
      isPinned,
    });
  }

  lockTopic(topicId: number, isLocked: boolean): Observable<ForumTopic> {
    return this.http.put<ForumTopic>(`${this.apiUrl}/topics/${topicId}/lock`, {
      isLocked,
    });
  }

  // ===== POSTS =====

  createPost(data: CreatePostDto): Observable<ForumPost> {
    return this.http.post<ForumPost>(`${this.apiUrl}/posts`, data);
  }

  getPostsByTopic(
    topicId: number,
    page: number = 1,
    limit: number = 10,
  ): Observable<PaginatedResponse<ForumPost>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<ForumPost>>(
      `${this.apiUrl}/topics/${topicId}/posts`,
      { params },
    );
  }

  updatePost(postId: number, data: UpdateContentDto): Observable<ForumPost> {
    return this.http.put<ForumPost>(`${this.apiUrl}/posts/${postId}`, data);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }

  markBestAnswer(postId: number): Observable<ForumPost> {
    return this.http.put<ForumPost>(
      `${this.apiUrl}/posts/${postId}/best-answer`,
      {},
    );
  }

  // ===== LIKES =====

  toggleLike(type: LikeableType, id: number): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/like`, { type, id });
  }

  getUserLikes(type: LikeableType, ids: number[]): Observable<number[]> {
    return this.http.post<number[]>(`${this.apiUrl}/likes/check`, {
      type,
      ids,
    });
  }

  // ===== TAGS =====

  getPopularTags(limit: number = 20): Observable<Tag[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Tag[]>(`${this.apiUrl}/tags/popular`, { params });
  }
}
