import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { PaymentGateway, Currency, CreatePaymentRequest } from '../models/payment.models';
import { SubscriptionPlan } from '../../subscriptions/models/subscription.models';

@Component({
  selector: 'app-payment-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-checkout">
      <div class="container">
        <div class="checkout-grid">
          <!-- Left: Order Summary -->
          <div class="order-summary">
            <h2>Оформление подписки</h2>

            <div *ngIf="plan()" class="plan-card">
              <h3>{{ plan()!.name }}</h3>
              <p class="plan-description">{{ plan()!.description }}</p>

              <div class="price-section">
                <div class="price">
                  <span class="amount">{{ selectedCurrency === 'usd' ? plan()!.priceUsd : plan()!.priceUzs }}</span>
                  <span class="currency">{{ selectedCurrency === 'usd' ? '$' : 'сум' }}</span>
                  <span class="period">/{{ plan()!.billingPeriod === 'monthly' ? 'месяц' : 'год' }}</span>
                </div>
              </div>

              <div class="features-list">
                <h4>Что входит:</h4>
                <ul>
                  <li>✓ {{ plan()!.features.maxCourses || 'Неограниченно' }} курсов</li>
                  <li>✓ {{ plan()!.features.maxStudents || 'Неограниченно' }} студентов</li>
                  <li>✓ {{ plan()!.features.storageGb || 'Неограниченное' }} хранилище</li>
                  <li *ngIf="plan()!.features.whiteLabel">✓ White-label брендинг</li>
                  <li *ngIf="plan()!.features.ssoEnabled">✓ SSO интеграция</li>
                  <li *ngIf="plan()!.features.scormSupport">✓ SCORM поддержка</li>
                  <li *ngIf="plan()!.features.apiAccess">✓ API доступ</li>
                </ul>
              </div>
            </div>

            <div class="summary-details">
              <div class="summary-row">
                <span>Подписка:</span>
                <span>{{ getPrice() }} {{ getCurrencySymbol() }}</span>
              </div>
              <div class="summary-row" *ngIf="plan()?.trialDays">
                <span>Пробный период:</span>
                <span class="highlight">{{ plan()!.trialDays }} дней бесплатно</span>
              </div>
              <div class="summary-row total">
                <span>Итого:</span>
                <span>{{ getPrice() }} {{ getCurrencySymbol() }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Payment Form -->
          <div class="payment-form">
            <h2>Способ оплаты</h2>

            <!-- Currency Selection -->
            <div class="form-group">
              <label>Валюта</label>
              <div class="currency-selector">
                <button
                  [class.active]="selectedCurrency === 'usd'"
                  (click)="selectedCurrency = 'usd'"
                >
                  💵 USD
                </button>
                <button
                  [class.active]="selectedCurrency === 'uzs'"
                  (click)="selectedCurrency = 'uzs'"
                >
                  🇺🇿 UZS
                </button>
              </div>
            </div>

            <!-- Gateway Selection -->
            <div class="form-group">
              <label>Платежная система</label>
              <div class="gateway-selector">
                <div
                  class="gateway-option"
                  [class.selected]="selectedGateway === 'stripe'"
                  (click)="selectedGateway = 'stripe'"
                >
                  <div class="gateway-logo">💳</div>
                  <div>
                    <h4>Stripe</h4>
                    <p>Visa, Mastercard, международные карты</p>
                  </div>
                </div>

                <div
                  *ngIf="selectedCurrency === 'uzs'"
                  class="gateway-option"
                  [class.selected]="selectedGateway === 'payme'"
                  (click)="selectedGateway = 'payme'"
                >
                  <div class="gateway-logo">📱</div>
                  <div>
                    <h4>Payme</h4>
                    <p>Узбекские карты, Payme кошелек</p>
                  </div>
                </div>

                <div
                  *ngIf="selectedCurrency === 'uzs'"
                  class="gateway-option"
                  [class.selected]="selectedGateway === 'click'"
                  (click)="selectedGateway = 'click'"
                >
                  <div class="gateway-logo">💰</div>
                  <div>
                    <h4>Click</h4>
                    <p>Узбекские карты, Click кошелек</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stripe Card Form -->
            <div *ngIf="selectedGateway === 'stripe'" class="card-form">
              <div class="form-group">
                <label>Номер карты</label>
                <input
                  type="text"
                  [(ngModel)]="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  (input)="formatCardNumber($event)"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Срок действия</label>
                  <input
                    type="text"
                    [(ngModel)]="cardExpiry"
                    placeholder="MM/YY"
                    maxlength="5"
                    (input)="formatExpiry($event)"
                  />
                </div>
                <div class="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    [(ngModel)]="cardCvv"
                    placeholder="123"
                    maxlength="3"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Имя на карте</label>
                <input
                  type="text"
                  [(ngModel)]="cardName"
                  placeholder="IVAN PETROV"
                />
              </div>
            </div>

            <!-- Payment Button -->
            <button
              class="btn-pay"
              (click)="processPayment()"
              [disabled]="processing() || !isFormValid()"
            >
              <span *ngIf="!processing()">
                🔒 Оплатить {{ getPrice() }} {{ getCurrencySymbol() }}
              </span>
              <span *ngIf="processing()">
                Обработка платежа...
              </span>
            </button>

            <div class="security-notice">
              <span class="icon">🔒</span>
              <p>
                Платеж обрабатывается через безопасное соединение.
                Мы не храним данные вашей карты.
              </p>
            </div>

            <div *ngIf="error()" class="error-message">
              <span class="icon">⚠️</span>
              <p>{{ error() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-checkout {
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 30px;
    }

    .order-summary, .payment-form {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 30px 0;
      color: #333;
      font-size: 1.75rem;
    }

    .plan-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 30px;
    }

    .plan-card h3 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
    }

    .plan-description {
      opacity: 0.9;
      margin: 0 0 24px 0;
    }

    .price-section {
      padding: 24px 0;
      border-top: 1px solid rgba(255,255,255,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.2);
      margin-bottom: 24px;
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .amount {
      font-size: 3rem;
      font-weight: 700;
    }

    .currency {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .period {
      font-size: 1rem;
      opacity: 0.9;
    }

    .features-list {
      margin: 0;
    }

    .features-list h4 {
      margin: 0 0 16px 0;
      font-size: 1rem;
    }

    .features-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features-list li {
      padding: 8px 0;
      opacity: 0.9;
    }

    .summary-details {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-row.total {
      font-size: 1.25rem;
      font-weight: 700;
      color: #667eea;
      padding-top: 16px;
      margin-top: 8px;
      border-top: 2px solid #e0e0e0;
    }

    .highlight {
      color: #4caf50;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 24px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    .currency-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .currency-selector button {
      padding: 16px;
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .currency-selector button.active {
      background: #f0f4ff;
      border-color: #667eea;
      color: #667eea;
    }

    .gateway-selector {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .gateway-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .gateway-option:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .gateway-option.selected {
      border-color: #667eea;
      background: #f0f4ff;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .gateway-logo {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 12px;
    }

    .gateway-option h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .gateway-option p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .card-form {
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .form-group input {
      width: 100%;
      padding: 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }

    .btn-pay {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .btn-pay:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .btn-pay:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .security-notice {
      display: flex;
      align-items: start;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-top: 20px;
    }

    .security-notice .icon {
      font-size: 1.5rem;
    }

    .security-notice p {
      margin: 0;
      color: #2e7d32;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .error-message {
      display: flex;
      align-items: start;
      gap: 12px;
      padding: 16px;
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 8px;
      margin-top: 20px;
    }

    .error-message .icon {
      font-size: 1.5rem;
    }

    .error-message p {
      margin: 0;
      color: #c62828;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    @media (max-width: 968px) {
      .checkout-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PaymentCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private subscriptionService = inject(SubscriptionService);

  plan = signal<SubscriptionPlan | null>(null);
  processing = signal(false);
  error = signal<string | null>(null);

  selectedCurrency: 'usd' | 'uzs' = 'usd';
  selectedGateway: PaymentGateway = PaymentGateway.STRIPE;

  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  ngOnInit() {
    const planId = this.route.snapshot.params['id'];
    this.loadPlan(planId);
  }

  loadPlan(id: number) {
    this.subscriptionService.getAllPlans().subscribe({
      next: (data) => {
        const plan = data.plans.find(p => p.id === id);
        if (plan) {
          this.plan.set(plan);
        }
      }
    });
  }

  getPrice(): number {
    if (!this.plan()) return 0;
    return this.selectedCurrency === 'usd' ? this.plan()!.priceUsd : this.plan()!.priceUzs;
  }

  getCurrencySymbol(): string {
    return this.selectedCurrency === 'usd' ? '$' : 'сум';
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    this.cardNumber = formatted;
  }

  formatExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.cardExpiry = value;
  }

  isFormValid(): boolean {
    if (!this.plan()) return false;

    if (this.selectedGateway === PaymentGateway.STRIPE) {
      return this.cardNumber.replace(/\s/g, '').length === 16 &&
             this.cardExpiry.length === 5 &&
             this.cardCvv.length === 3 &&
             this.cardName.length > 0;
    }

    return true;
  }

  processPayment() {
    if (!this.isFormValid()) return;

    this.processing.set(true);
    this.error.set(null);

    const request: CreatePaymentRequest = {
      amount: this.getPrice(),
      currency: this.selectedCurrency === 'usd' ? Currency.USD : Currency.UZS,
      gateway: this.selectedGateway,
      planId: this.plan()!.id,
      description: `Подписка ${this.plan()!.name}`,
      returnUrl: `${window.location.origin}/payments/success`
    };

    this.paymentService.createPayment(request).subscribe({
      next: (response) => {
        // For Stripe, process with client-side SDK
        if (this.selectedGateway === PaymentGateway.STRIPE) {
          this.processStripePayment(response);
        }
        // For Payme/Click, redirect to gateway
        else {
          window.location.href = response.clientSecret; // This would be the payment URL
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(err.error?.message || 'Ошибка при обработке платежа');
      }
    });
  }

  processStripePayment(response: any) {
    // Simulate Stripe payment processing
    setTimeout(() => {
      this.processing.set(false);
      this.router.navigate(['/payments/success'], {
        queryParams: { paymentId: response.paymentId }
      });
    }, 2000);
  }
}
