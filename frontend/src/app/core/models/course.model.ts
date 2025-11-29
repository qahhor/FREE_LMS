export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  language: string;
  level: CourseLevel;
  status: CourseStatus;
  duration: number;
  lessonsCount: number;
  enrollmentCount: number;
  rating: number;
  reviewsCount: number;
  instructorId: number;
  instructorName: string;
  instructorAvatar?: string;
  categoryId: number;
  categoryName: string;
  tags: string[];
  requirements: string[];
  objectives: string[];
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL_LEVELS = 'ALL_LEVELS'
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  language?: string;
  level: CourseLevel;
  categoryId: number;
  tags?: string[];
  requirements?: string[];
  objectives?: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {}

export interface CourseFilter {
  categoryId?: number;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  language?: string;
  instructorId?: number;
  isFeatured?: boolean;
}
