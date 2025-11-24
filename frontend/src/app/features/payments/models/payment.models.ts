export interface Payment {
  id: number;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  gateway: PaymentGateway;
  transactionId: string | null;
  description: string;
  metadata: any;
  createdAt: Date;
  completedAt: Date | null;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYME = 'payme',
  CLICK = 'click'
}

export enum Currency {
  USD = 'usd',
  UZS = 'uzs',
  EUR = 'eur',
  RUB = 'rub'
}

export interface CreatePaymentRequest {
  amount: number;
  currency: Currency;
  gateway: PaymentGateway;
  planId?: number;
  description?: string;
  returnUrl?: string;
}

export interface PaymentMethod {
  id: number;
  type: 'card' | 'bank_account';
  gateway: PaymentGateway;
  last4: string;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  currency: Currency;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  downloadUrl: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentCheckoutData {
  planId: number;
  planName: string;
  priceUsd: number;
  priceUzs: number;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: number;
  publicKey: string;
}

export interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successRate: number;
  averageAmount: number;
}
