import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SubscriptionPlan,
  Subscription,
  SubscriptionUsage,
  CreateSubscriptionRequest,
  UpgradeSubscriptionRequest,
} from '../models/subscription.models';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  /**
   * Get all subscription plans
   */
  getAllPlans(): Observable<{ plans: SubscriptionPlan[] }> {
    return this.http.get<{ plans: SubscriptionPlan[] }>(`${this.apiUrl}/plans`);
  }

  /**
   * Get plan by ID
   */
  getPlanById(id: number): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.apiUrl}/plans/${id}`);
  }

  /**
   * Subscribe to a plan
   */
  subscribe(request: CreateSubscriptionRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscribe`, request);
  }

  /**
   * Get current user's subscription
   */
  getCurrentSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/current`);
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(immediate: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel`, { immediate });
  }

  /**
   * Reactivate subscription
   */
  reactivateSubscription(): Observable<any> {
    return this.http.post(`${this.apiUrl}/reactivate`, {});
  }

  /**
   * Upgrade subscription
   */
  upgradeSubscription(request: UpgradeSubscriptionRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/upgrade`, request);
  }

  /**
   * Check usage limits
   */
  checkLimit(type: 'course' | 'student' | 'storage', value?: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/limits/check`, {
      params: { type, ...(value && { value: value.toString() }) },
    });
  }

  /**
   * Get usage statistics
   */
  getUsage(): Observable<SubscriptionUsage> {
    return this.http.get<SubscriptionUsage>(`${this.apiUrl}/usage`);
  }
}
