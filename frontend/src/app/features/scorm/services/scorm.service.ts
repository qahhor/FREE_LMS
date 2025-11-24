import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ScormPackage,
  ScormTracking,
  ScormUploadRequest,
  ScormLaunchData,
  ScormProgress
} from '../models/scorm.models';

@Injectable({
  providedIn: 'root',
})
export class ScormService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scorm`;

  uploadPackage(data: FormData): Observable<ScormPackage> {
    return this.http.post<ScormPackage>(`${this.apiUrl}/upload`, data);
  }

  getPackages(): Observable<{ packages: ScormPackage[] }> {
    return this.http.get<{ packages: ScormPackage[] }>(this.apiUrl);
  }

  getPackage(id: number): Observable<ScormPackage> {
    return this.http.get<ScormPackage>(`${this.apiUrl}/${id}`);
  }

  deletePackage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  launchPackage(id: number): Observable<ScormLaunchData> {
    return this.http.post<ScormLaunchData>(`${this.apiUrl}/${id}/launch`, {});
  }

  getTracking(packageId: number, sessionId: string): Observable<ScormTracking> {
    return this.http.get<ScormTracking>(`${this.apiUrl}/${packageId}/tracking/${sessionId}`);
  }

  updateTracking(packageId: number, sessionId: string, data: Partial<ScormTracking>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${packageId}/tracking/${sessionId}`, data);
  }

  getUserProgress(): Observable<{ progress: ScormProgress[] }> {
    return this.http.get<{ progress: ScormProgress[] }>(`${this.apiUrl}/progress`);
  }

  getPackageProgress(packageId: number): Observable<ScormProgress> {
    return this.http.get<ScormProgress>(`${this.apiUrl}/${packageId}/progress`);
  }

  // SCORM API communication methods
  setValue(sessionId: string, key: string, value: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/set-value`, { sessionId, key, value });
  }

  getValue(sessionId: string, key: string): Observable<{ value: any }> {
    return this.http.get<{ value: any }>(`${this.apiUrl}/api/get-value`, {
      params: { sessionId, key }
    });
  }

  commit(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/commit`, { sessionId });
  }

  terminate(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/terminate`, { sessionId });
  }
}
