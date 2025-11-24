import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Webinar,
  CreateWebinarRequest,
  UpdateWebinarRequest,
  JoinWebinarResponse,
  WebinarStats,
  WebinarCalendarEvent,
  WebinarParticipant
} from '../models/webinar.models';

@Injectable({
  providedIn: 'root',
})
export class WebinarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/webinars`;

  createWebinar(data: CreateWebinarRequest): Observable<Webinar> {
    return this.http.post<Webinar>(this.apiUrl, data);
  }

  getWebinars(): Observable<{ webinars: Webinar[] }> {
    return this.http.get<{ webinars: Webinar[] }>(this.apiUrl);
  }

  getWebinar(id: number): Observable<Webinar> {
    return this.http.get<Webinar>(`${this.apiUrl}/${id}`);
  }

  updateWebinar(id: number, data: UpdateWebinarRequest): Observable<Webinar> {
    return this.http.patch<Webinar>(`${this.apiUrl}/${id}`, data);
  }

  deleteWebinar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  joinWebinar(id: number): Observable<JoinWebinarResponse> {
    return this.http.post<JoinWebinarResponse>(`${this.apiUrl}/${id}/join`, {});
  }

  leaveWebinar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/leave`, {});
  }

  startWebinar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/start`, {});
  }

  endWebinar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/end`, {});
  }

  getParticipants(id: number): Observable<{ participants: WebinarParticipant[] }> {
    return this.http.get<{ participants: WebinarParticipant[] }>(`${this.apiUrl}/${id}/participants`);
  }

  getStats(): Observable<WebinarStats> {
    return this.http.get<WebinarStats>(`${this.apiUrl}/stats`);
  }

  getCalendarEvents(startDate: Date, endDate: Date): Observable<{ events: WebinarCalendarEvent[] }> {
    return this.http.get<{ events: WebinarCalendarEvent[] }>(`${this.apiUrl}/calendar`, {
      params: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  }

  getRecording(id: number): Observable<{ url: string; duration: number }> {
    return this.http.get<{ url: string; duration: number }>(`${this.apiUrl}/${id}/recording`);
  }
}
