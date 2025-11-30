export interface Certificate {
  id: number;
  certificateNumber: string;
  userId: number;
  userName: string;
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  expiresAt?: string;
  downloadUrl?: string;
  verificationUrl: string;
}
