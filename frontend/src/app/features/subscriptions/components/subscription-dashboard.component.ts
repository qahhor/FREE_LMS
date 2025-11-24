import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { Subscription, SubscriptionUsage, SubscriptionStatus } from '../models/subscription.models';

@Component({
  selector: 'app-subscription-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="subscription-dashboard">
      <div class="container">
        <h1>Моя подписка</h1>

        <!-- Loading -->
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="error-message">
          <p>{{ error() }}</p>
          <button (click)="loadSubscription()">Попробовать снова</button>
        </div>

        <div *ngIf="!loading() && !error() && subscription()">
          <!-- Current Plan Card -->
          <div class="plan-card" [class.trial]="subscription()!.status === 'trialing'">
            <div class="card-header">
              <div class="plan-info">
                <h2>{{ subscription()!.plan.name }}</h2>
                <span class="status-badge" [class]="subscription()!.status">
                  {{ getStatusText(subscription()!.status) }}
                </span>
              </div>
              <div class="actions">
                <button
                  *ngIf="subscription()!.status === 'active'"
                  class="btn-upgrade"
                  (click)="navigateToUpgrade()"
                >
                  Повысить тариф
                </button>
                <button
                  *ngIf="subscription()!.status === 'active' && subscription()!.autoRenew"
                  class="btn-cancel"
                  (click)="cancelSubscription()"
                >
                  Отменить подписку
                </button>
                <button
                  *ngIf="subscription()!.cancelledAt && subscription()!.status === 'active'"
                  class="btn-reactivate"
                  (click)="reactivateSubscription()"
                >
                  Возобновить автопродление
                </button>
              </div>
            </div>

            <div class="plan-details">
              <!-- Trial Info -->
              <div *ngIf="subscription()!.status === 'trialing'" class="trial-info">
                <i class="icon-clock"></i>
                <span>
                  Пробный период до {{ subscription()!.trialEnd | date: 'dd MMM yyyy' }}
                </span>
              </div>

              <!-- Billing Info -->
              <div class="billing-info">
                <div class="info-item">
                  <span class="label">Период подписки:</span>
                  <span class="value">
                    {{ subscription()!.currentPeriodStart | date: 'dd MMM' }} -
                    {{ subscription()!.currentPeriodEnd | date: 'dd MMM yyyy' }}
                  </span>
                </div>

                <div class="info-item" *ngIf="subscription()!.autoRenew">
                  <span class="label">Следующий платеж:</span>
                  <span class="value">{{ subscription()!.currentPeriodEnd | date: 'dd MMM yyyy' }}</span>
                </div>

                <div class="info-item" *ngIf="subscription()!.cancelledAt">
                  <span class="label">Подписка отменена:</span>
                  <span class="value warning">
                    Истекает {{ subscription()!.currentPeriodEnd | date: 'dd MMM yyyy' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Usage Statistics -->
          <div class="usage-section" *ngIf="usage()">
            <h2>Использование ресурсов</h2>

            <div class="usage-grid">
              <!-- Courses Usage -->
              <div class="usage-card">
                <div class="usage-header">
                  <h3>Курсы</h3>
                  <span class="usage-value">
                    {{ usage()!.courses.used }}
                    <span class="usage-max" *ngIf="!usage()!.courses.unlimited">
                      / {{ usage()!.courses.max }}
                    </span>
                    <span class="usage-max" *ngIf="usage()!.courses.unlimited">
                      / ∞
                    </span>
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    [class.warning]="usage()!.courses.percentage >= 80"
                    [class.danger]="usage()!.courses.percentage >= 100"
                    [style.width.%]="Math.min(usage()!.courses.percentage, 100)"
                  ></div>
                </div>
                <p class="usage-text">{{ usage()!.courses.percentage }}% использовано</p>
              </div>

              <!-- Students Usage -->
              <div class="usage-card">
                <div class="usage-header">
                  <h3>Студенты</h3>
                  <span class="usage-value">
                    {{ usage()!.students.used }}
                    <span class="usage-max" *ngIf="!usage()!.students.unlimited">
                      / {{ usage()!.students.max }}
                    </span>
                    <span class="usage-max" *ngIf="usage()!.students.unlimited">
                      / ∞
                    </span>
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    [class.warning]="usage()!.students.percentage >= 80"
                    [class.danger]="usage()!.students.percentage >= 100"
                    [style.width.%]="Math.min(usage()!.students.percentage, 100)"
                  ></div>
                </div>
                <p class="usage-text">{{ usage()!.students.percentage }}% использовано</p>
              </div>

              <!-- Storage Usage -->
              <div class="usage-card">
                <div class="usage-header">
                  <h3>Хранилище</h3>
                  <span class="usage-value">
                    {{ usage()!.storage.used | number: '1.2-2' }} {{ usage()!.storage.unit }}
                    <span class="usage-max" *ngIf="!usage()!.storage.unlimited">
                      / {{ usage()!.storage.max }} {{ usage()!.storage.unit }}
                    </span>
                    <span class="usage-max" *ngIf="usage()!.storage.unlimited">
                      / ∞
                    </span>
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    [class.warning]="usage()!.storage.percentage >= 80"
                    [class.danger]="usage()!.storage.percentage >= 100"
                    [style.width.%]="Math.min(usage()!.storage.percentage, 100)"
                  ></div>
                </div>
                <p class="usage-text">{{ usage()!.storage.percentage }}% использовано</p>
              </div>
            </div>

            <div class="usage-warning" *ngIf="hasLimitWarnings()">
              <i class="icon-warning"></i>
              <span>
                Вы приближаетесь к лимитам вашего тарифа. Рассмотрите возможность обновления.
              </span>
              <button class="btn-upgrade-small" (click)="navigateToUpgrade()">
                Повысить тариф
              </button>
            </div>
          </div>

          <!-- Features List -->
          <div class="features-section">
            <h2>Ваши возможности</h2>
            <div class="features-grid">
              <div class="feature-item" *ngIf="subscription()!.plan.features.maxCourses">
                <i class="icon-check"></i>
                <span>{{ subscription()!.plan.features.maxCourses }} курсов</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.maxStudents">
                <i class="icon-check"></i>
                <span>{{ subscription()!.plan.features.maxStudents }} студентов</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.storageGb">
                <i class="icon-check"></i>
                <span>{{ subscription()!.plan.features.storageGb }} GB хранилище</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.videoHours">
                <i class="icon-check"></i>
                <span>{{ subscription()!.plan.features.videoHours }} часов видео</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.liveSessions">
                <i class="icon-check"></i>
                <span>{{ subscription()!.plan.features.liveSessions }} живых сессий</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.customDomain">
                <i class="icon-check"></i>
                <span>Собственный домен</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.whiteLabel">
                <i class="icon-check"></i>
                <span>White-label брендинг</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.ssoEnabled">
                <i class="icon-check"></i>
                <span>SSO интеграция</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.scormSupport">
                <i class="icon-check"></i>
                <span>SCORM поддержка</span>
              </div>
              <div class="feature-item" *ngIf="subscription()!.plan.features.apiAccess">
                <i class="icon-check"></i>
                <span>API доступ</span>
              </div>
            </div>
          </div>

          <!-- Billing History -->
          <div class="billing-history">
            <h2>История платежей</h2>
            <p class="coming-soon">Скоро будет доступна история ваших платежей...</p>
            <button class="btn-secondary" routerLink="/billing">
              Посмотреть все счета
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscription-dashboard {
      padding: 40px 20px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 40px;
    }

    h2 {
      font-size: 1.75rem;
      color: #333;
      margin-bottom: 20px;
    }

    .plan-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .plan-card.trial {
      border-left: 4px solid #2196f3;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .plan-info h2 {
      margin: 0 0 10px 0;
      font-size: 2rem;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.trialing { background: #e3f2fd; color: #1976d2; }
    .status-badge.past_due { background: #fff3e0; color: #f57c00; }
    .status-badge.cancelled { background: #ffebee; color: #c62828; }
    .status-badge.expired { background: #f5f5f5; color: #616161; }

    .actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-upgrade {
      background: #667eea;
      color: white;
    }

    .btn-upgrade:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }

    .btn-cancel {
      background: transparent;
      border: 2px solid #e53935;
      color: #e53935;
    }

    .btn-reactivate {
      background: #4caf50;
      color: white;
    }

    .trial-info {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      color: #1976d2;
      font-weight: 500;
    }

    .billing-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .label {
      color: #666;
      font-weight: 500;
    }

    .value {
      color: #333;
      font-weight: 600;
    }

    .value.warning {
      color: #f57c00;
    }

    .usage-section {
      background: white;
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .usage-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }

    .usage-card {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .usage-header h3 {
      margin: 0;
      font-size: 1.125rem;
      color: #333;
    }

    .usage-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #667eea;
    }

    .usage-max {
      color: #999;
      font-weight: 400;
      font-size: 1rem;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: #667eea;
      transition: width 0.3s, background-color 0.3s;
    }

    .progress-fill.warning {
      background: #ff9800;
    }

    .progress-fill.danger {
      background: #f44336;
    }

    .usage-text {
      color: #666;
      font-size: 0.875rem;
      margin: 0;
    }

    .usage-warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 16px;
      color: #f57c00;
      font-weight: 500;
    }

    .btn-upgrade-small {
      background: #ff9800;
      color: white;
      padding: 8px 20px;
      margin-left: auto;
    }

    .features-section {
      background: white;
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .icon-check::before {
      content: '✓';
      color: #4caf50;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .billing-history {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .coming-soon {
      color: #999;
      margin: 20px 0;
    }

    .btn-secondary {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .loading, .error-message {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .usage-grid {
        grid-template-columns: 1fr;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SubscriptionDashboardComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  subscription = signal<Subscription | null>(null);
  usage = signal<SubscriptionUsage | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  Math = Math;

  ngOnInit() {
    this.loadSubscription();
    this.loadUsage();
  }

  loadSubscription() {
    this.loading.set(true);
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (sub) => {
        this.subscription.set(sub);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Не удалось загрузить подписку');
        this.loading.set(false);
        console.error('Error loading subscription:', err);
      }
    });
  }

  loadUsage() {
    this.subscriptionService.getUsage().subscribe({
      next: (usage) => this.usage.set(usage),
      error: (err) => console.error('Error loading usage:', err)
    });
  }

  getStatusText(status: SubscriptionStatus): string {
    const statusTexts = {
      'active': 'Активна',
      'trialing': 'Пробный период',
      'past_due': 'Просрочена',
      'cancelled': 'Отменена',
      'expired': 'Истекла',
      'pending': 'В ожидании'
    };
    return statusTexts[status] || status;
  }

  hasLimitWarnings(): boolean {
    const u = this.usage();
    if (!u) return false;
    return u.courses.percentage >= 80 ||
           u.students.percentage >= 80 ||
           u.storage.percentage >= 80;
  }

  navigateToUpgrade() {
    this.router.navigate(['/subscriptions/pricing']);
  }

  cancelSubscription() {
    if (confirm('Вы уверены, что хотите отменить подписку? Доступ сохранится до конца оплаченного периода.')) {
      this.subscriptionService.cancelSubscription(false).subscribe({
        next: () => {
          alert('Подписка отменена. Вы можете продолжать использовать сервис до конца текущего периода.');
          this.loadSubscription();
        },
        error: (err) => {
          alert('Ошибка при отмене подписки');
          console.error(err);
        }
      });
    }
  }

  reactivateSubscription() {
    this.subscriptionService.reactivateSubscription().subscribe({
      next: () => {
        alert('Автопродление возобновлено!');
        this.loadSubscription();
      },
      error: (err) => {
        alert('Ошибка при возобновлении подписки');
        console.error(err);
      }
    });
  }
}
