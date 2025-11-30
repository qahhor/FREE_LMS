export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  courseThumbnail?: string;
  courseInstructor: string;
  status: EnrollmentStatus;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  completedAt?: string;
  enrolledAt: string;
  expiresAt?: string;
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  EXPIRED = 'EXPIRED'
}

export interface EnrollRequest {
  courseId: number;
  paymentId?: number;
}

export interface UpdateProgressRequest {
  lessonId: number;
  completed: boolean;
  progressPercentage?: number;
}
