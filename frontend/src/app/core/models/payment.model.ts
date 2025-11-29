export interface Payment {
  id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  refundReason?: string;
  createdAt: string;
  completedAt?: string;
  refundedAt?: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  PAYME = 'PAYME',
  CLICK = 'CLICK',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface CreatePaymentRequest {
  courseId: number;
  paymentMethod: PaymentMethod;
  returnUrl?: string;
}
