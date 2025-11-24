import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionPlan, SubscriptionTier, BillingPeriod } from '../models/subscription.models';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pricing-page">
      <div class="container">
        <!-- Header -->
        <div class="pricing-header">
          <h1>Выберите свой тариф</h1>
          <p class="subtitle">
            Начните бесплатно и обновляйтесь по мере роста вашего бизнеса
          </p>

          <!-- Billing Period Toggle -->
          <div class="billing-toggle">
            <button
              [class.active]="selectedPeriod() === 'monthly'"
              (click)="selectedPeriod.set('monthly')"
            >
              Ежемесячно
            </button>
            <button
              [class.active]="selectedPeriod() === 'yearly'"
              (click)="selectedPeriod.set('yearly')"
            >
              Ежегодно
              <span class="badge">Скидка 16%</span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Загрузка тарифов...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="error">
          <p>{{ error() }}</p>
          <button (click)="loadPlans()">Попробовать снова</button>
        </div>

        <!-- Plans Grid -->
        <div *ngIf="!loading() && !error()" class="plans-grid">
          <div
            *ngFor="let plan of filteredPlans()"
            class="plan-card"
            [class.popular]="plan.isPopular"
            [class.free]="plan.tier === 'free'"
          >
            <!-- Popular Badge -->
            <div *ngIf="plan.isPopular" class="popular-badge">
              ⭐ Популярный
            </div>

            <!-- Plan Header -->
            <div class="plan-header">
              <h3>{{ plan.name }}</h3>
              <p class="description">{{ plan.description }}</p>
            </div>

            <!-- Pricing -->
            <div class="pricing">
              <div class="price">
                <span class="currency">$</span>
                <span class="amount">{{ getPlanPrice(plan) }}</span>
                <span class="period" *ngIf="plan.tier !== 'free'">
                  /{{ selectedPeriod() === 'monthly' ? 'мес' : 'год' }}
                </span>
              </div>
              <p class="price-uzs" *ngIf="plan.priceUzs > 0">
                {{ formatUzsPrice(plan.priceUzs) }} сум
              </p>
            </div>

            <!-- Trial Badge -->
            <div *ngIf="plan.trialDays > 0" class="trial-badge">
              {{ plan.trialDays }} дней бесплатно
            </div>

            <!-- Features List -->
            <ul class="features-list">
              <!-- Courses -->
              <li>
                <i class="icon-check"></i>
                <span *ngIf="plan.features.maxCourses">
                  {{ plan.features.maxCourses }} курсов
                </span>
                <span *ngIf="!plan.features.maxCourses">
                  Неограниченно курсов
                </span>
              </li>

              <!-- Students -->
              <li>
                <i class="icon-check"></i>
                <span *ngIf="plan.features.maxStudents">
                  {{ plan.features.maxStudents }} студентов
                </span>
                <span *ngIf="!plan.features.maxStudents">
                  Неограниченно студентов
                </span>
              </li>

              <!-- Storage -->
              <li>
                <i class="icon-check"></i>
                <span *ngIf="plan.features.storageGb">
                  {{ plan.features.storageGb }} GB хранилище
                </span>
                <span *ngIf="!plan.features.storageGb">
                  Неограниченное хранилище
                </span>
              </li>

              <!-- Video Hours -->
              <li *ngIf="plan.features.videoHours">
                <i class="icon-check"></i>
                {{ plan.features.videoHours }} часов видео
              </li>

              <!-- Live Sessions -->
              <li *ngIf="plan.features.liveSessions">
                <i class="icon-check"></i>
                {{ plan.features.liveSessions }} живых сессий
              </li>

              <!-- Custom Domain -->
              <li *ngIf="plan.features.customDomain">
                <i class="icon-check"></i>
                Собственный домен
              </li>

              <!-- White Label -->
              <li *ngIf="plan.features.whiteLabel">
                <i class="icon-check"></i>
                White-label брендинг
              </li>

              <!-- SSO -->
              <li *ngIf="plan.features.ssoEnabled">
                <i class="icon-check"></i>
                SSO интеграция
              </li>

              <!-- SCORM -->
              <li *ngIf="plan.features.scormSupport">
                <i class="icon-check"></i>
                SCORM поддержка
              </li>

              <!-- API Access -->
              <li *ngIf="plan.features.apiAccess">
                <i class="icon-check"></i>
                API доступ
              </li>

              <!-- Analytics -->
              <li *ngIf="plan.features.advancedAnalytics">
                <i class="icon-check"></i>
                Расширенная аналитика
              </li>

              <!-- Support -->
              <li *ngIf="plan.features.prioritySupport">
                <i class="icon-check"></i>
                Приоритетная поддержка
              </li>

              <!-- Dedicated Manager -->
              <li *ngIf="plan.features.dedicatedManager">
                <i class="icon-check"></i>
                Персональный менеджер
              </li>
            </ul>

            <!-- CTA Button -->
            <button
              class="cta-button"
              [class.primary]="plan.isPopular"
              (click)="selectPlan(plan)"
            >
              <span *ngIf="plan.tier === 'free'">Начать бесплатно</span>
              <span *ngIf="plan.tier === 'enterprise'">Связаться с нами</span>
              <span
                *ngIf="plan.tier !== 'free' && plan.tier !== 'enterprise'"
              >
                Выбрать {{ plan.name }}
              </span>
            </button>

            <!-- Contact for Enterprise -->
            <p *ngIf="plan.tier === 'enterprise'" class="contact-note">
              Свяжитесь с нами для индивидуального предложения
            </p>
          </div>
        </div>

        <!-- Features Comparison -->
        <div class="features-comparison">
          <h2>Сравнение возможностей</h2>
          <p>Все функции, доступные в каждом тарифе</p>

          <div class="comparison-table">
            <!-- Table will be implemented here -->
            <p class="coming-soon">Полная таблица сравнения скоро...</p>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="faq-section">
          <h2>Часто задаваемые вопросы</h2>

          <div class="faq-item">
            <h3>Могу ли я изменить тариф в любое время?</h3>
            <p>
              Да, вы можете повысить или понизить тариф в любое время. При
              повышении тарифа будет произведен пропорциональный расчет.
            </p>
          </div>

          <div class="faq-item">
            <h3>Какие способы оплаты вы принимаете?</h3>
            <p>
              Мы принимаем Payme, Click (для Узбекистана) и международные
              карты через Stripe.
            </p>
          </div>

          <div class="faq-item">
            <h3>Есть ли скидки для некоммерческих организаций?</h3>
            <p>
              Да, мы предоставляем специальные скидки для образовательных
              учреждений и НКО. Свяжитесь с нами для получения подробностей.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pricing-page {
        padding: 60px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
      }

      .pricing-header {
        text-align: center;
        color: white;
        margin-bottom: 60px;
      }

      .pricing-header h1 {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 20px;
      }

      .subtitle {
        font-size: 1.25rem;
        opacity: 0.9;
        margin-bottom: 40px;
      }

      .billing-toggle {
        display: inline-flex;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
        padding: 5px;
        border-radius: 50px;
      }

      .billing-toggle button {
        padding: 12px 30px;
        border: none;
        border-radius: 50px;
        background: transparent;
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 500;
      }

      .billing-toggle button.active {
        background: white;
        color: #667eea;
      }

      .billing-toggle .badge {
        display: inline-block;
        margin-left: 8px;
        padding: 2px 8px;
        background: #4caf50;
        border-radius: 12px;
        font-size: 0.75rem;
      }

      .plans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
        margin-bottom: 80px;
      }

      .plan-card {
        background: white;
        border-radius: 20px;
        padding: 40px 30px;
        position: relative;
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .plan-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      }

      .plan-card.popular {
        border: 3px solid #4caf50;
        transform: scale(1.05);
      }

      .popular-badge {
        position: absolute;
        top: -15px;
        right: 30px;
        background: #4caf50;
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .plan-header h3 {
        font-size: 1.75rem;
        color: #333;
        margin-bottom: 10px;
      }

      .description {
        color: #666;
        margin-bottom: 30px;
      }

      .pricing {
        margin-bottom: 20px;
      }

      .price {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }

      .currency {
        font-size: 1.5rem;
        color: #667eea;
        font-weight: 600;
      }

      .amount {
        font-size: 3.5rem;
        font-weight: 700;
        color: #333;
      }

      .period {
        font-size: 1rem;
        color: #666;
      }

      .price-uzs {
        color: #999;
        font-size: 0.875rem;
        margin-top: 5px;
      }

      .trial-badge {
        background: #e3f2fd;
        color: #1976d2;
        padding: 8px 16px;
        border-radius: 20px;
        text-align: center;
        font-weight: 600;
        margin-bottom: 30px;
        font-size: 0.875rem;
      }

      .features-list {
        list-style: none;
        padding: 0;
        margin: 30px 0;
      }

      .features-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        color: #555;
        border-bottom: 1px solid #f0f0f0;
      }

      .icon-check::before {
        content: '✓';
        color: #4caf50;
        font-weight: 700;
        font-size: 1.2rem;
      }

      .cta-button {
        width: 100%;
        padding: 16px;
        border: 2px solid #667eea;
        background: transparent;
        color: #667eea;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s;
      }

      .cta-button.primary {
        background: #667eea;
        color: white;
      }

      .cta-button:hover {
        background: #667eea;
        color: white;
        transform: scale(1.02);
      }

      .contact-note {
        text-align: center;
        color: #999;
        font-size: 0.875rem;
        margin-top: 15px;
      }

      .features-comparison,
      .faq-section {
        background: white;
        border-radius: 20px;
        padding: 60px 40px;
        margin-bottom: 40px;
      }

      .features-comparison h2,
      .faq-section h2 {
        font-size: 2.5rem;
        color: #333;
        text-align: center;
        margin-bottom: 40px;
      }

      .coming-soon {
        text-align: center;
        color: #999;
        padding: 60px 0;
      }

      .faq-item {
        margin-bottom: 30px;
        padding-bottom: 30px;
        border-bottom: 1px solid #f0f0f0;
      }

      .faq-item h3 {
        color: #333;
        margin-bottom: 15px;
      }

      .faq-item p {
        color: #666;
        line-height: 1.6;
      }

      .loading,
      .error {
        text-align: center;
        padding: 60px 20px;
        color: white;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 768px) {
        .pricing-header h1 {
          font-size: 2rem;
        }

        .plans-grid {
          grid-template-columns: 1fr;
        }

        .plan-card.popular {
          transform: scale(1);
        }
      }
    `,
  ],
})
export class PricingPageComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  plans = signal<SubscriptionPlan[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedPeriod = signal<BillingPeriod>(BillingPeriod.MONTHLY);

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loading.set(true);
    this.error.set(null);

    this.subscriptionService.getAllPlans().subscribe({
      next: (response) => {
        this.plans.set(response.plans);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Не удалось загрузить тарифы. Попробуйте позже.');
        this.loading.set(false);
        console.error('Error loading plans:', err);
      },
    });
  }

  filteredPlans() {
    return this.plans().filter(
      (plan) => plan.billingPeriod === this.selectedPeriod() || plan.tier === SubscriptionTier.FREE
    );
  }

  getPlanPrice(plan: SubscriptionPlan): number {
    if (plan.tier === SubscriptionTier.FREE) return 0;
    if (plan.tier === SubscriptionTier.ENTERPRISE) return 0; // Custom pricing

    return this.selectedPeriod() === BillingPeriod.MONTHLY
      ? plan.priceUsd
      : Math.round(plan.priceUsd * 12 * 0.84); // 16% discount for yearly
  }

  formatUzsPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price);
  }

  selectPlan(plan: SubscriptionPlan) {
    if (plan.tier === SubscriptionTier.FREE) {
      this.router.navigate(['/auth/register']);
    } else if (plan.tier === SubscriptionTier.ENTERPRISE) {
      this.router.navigate(['/contact']);
    } else {
      this.router.navigate(['/subscriptions/checkout', plan.id]);
    }
  }
}
