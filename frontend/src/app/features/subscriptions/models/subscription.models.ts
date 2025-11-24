export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface SubscriptionPlan {
  id: number;
  tier: SubscriptionTier;
  name: string;
  description: string;
  billingPeriod: BillingPeriod;
  priceUsd: number;
  priceUzs: number;
  priceRub: number;
  priceEur: number;
  trialDays: number;
  isPopular: boolean;
  features: {
    maxCourses: number | null;
    maxStudents: number | null;
    storageGb: number | null;
    videoHours: number | null;
    liveSessions: number | null;
    customDomain: boolean;
    whiteLabel: boolean;
    ssoEnabled: boolean;
    scormSupport: boolean;
    apiAccess: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    dedicatedManager: boolean;
  };
}

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  usage: {
    coursesUsed: number;
    studentsUsed: number;
    storageUsedGb: number;
  };
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart: Date | null;
  trialEnd: Date | null;
  autoRenew: boolean;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface SubscriptionUsage {
  courses: {
    used: number;
    max: number | null;
    percentage: number;
    unlimited: boolean;
  };
  students: {
    used: number;
    max: number | null;
    percentage: number;
    unlimited: boolean;
  };
  storage: {
    used: number;
    max: number | null;
    percentage: number;
    unlimited: boolean;
    unit: string;
  };
}

export interface CreateSubscriptionRequest {
  planId: number;
  gateway: 'payme' | 'click' | 'stripe';
  autoRenew?: boolean;
}

export interface UpgradeSubscriptionRequest {
  planId: number;
  prorated?: boolean;
}
