import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import { VideoProgress } from '../video/entities/video-progress.entity';
import { CourseModule } from '../courses/entities/course-module.entity';
import { Lesson } from '../courses/entities/lesson.entity';

interface CourseProgress {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  videosWatched: number;
  totalVideos: number;
  averageQuizScore: number;
  totalTimeSpent: number; // in seconds
  lastActivity: Date;
  estimatedCompletionDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface ModuleProgress {
  moduleId: number;
  moduleName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
}

interface LessonProgressDetail {
  lessonId: number;
  lessonTitle: string;
  lessonType: string;
  status: string;
  progress: number;
  timeSpent?: number;
  quizScore?: number;
  lastAccessed?: Date;
  completedAt?: Date;
}

interface LearningPath {
  userId: number;
  totalCoursesEnrolled: number;
  coursesInProgress: number;
  coursesCompleted: number;
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalLearningTime: number; // in seconds
  certificatesEarned: number;
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastActivityDate: Date;
  recentActivity: Array<{
    date: Date;
    activityType: string;
    description: string;
  }>;
}

/**
 * Comprehensive progress tracking service
 * Tracks and calculates progress across courses, lessons, quizzes, and videos
 */
@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private lessonProgressRepository: Repository<LessonProgress>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(VideoProgress)
    private videoProgressRepository: Repository<VideoProgress>,
    @InjectRepository(CourseModule)
    private moduleRepository: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  /**
   * Get comprehensive course progress for a user
   */
  async getCourseProgress(
    userId: number,
    courseId: number,
  ): Promise<CourseProgress> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { userId, courseId },
      relations: ['course', 'course.modules', 'course.modules.lessons'],
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const course = enrollment.course;
    const modules = course.modules || [];
    const allLessons = modules.flatMap((m) => m.lessons || []);

    // Get lesson progress
    const lessonProgress = await this.lessonProgressRepository.find({
      where: { enrollmentId: enrollment.id },
    });

    const completedLessons = lessonProgress.filter(
      (lp) => lp.status === 'completed',
    ).length;

    // Get module completion
    const moduleProgress = await this.getModuleProgress(enrollment.id, modules);
    const completedModules = moduleProgress.filter((mp) => mp.isCompleted)
      .length;

    // Get quiz statistics
    const quizLessons = allLessons.filter((l) => l.type === 'quiz');
    const quizAttempts = await this.quizAttemptRepository.find({
      where: {
        userId,
        quiz: { lessonId: quizLessons.map((l) => l.id) as any },
        status: 'completed',
      },
    });

    const passedQuizzes = new Set(
      quizAttempts.filter((qa) => qa.isPassed).map((qa) => qa.quizId),
    ).size;

    const averageQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, qa) => sum + qa.scorePercentage, 0) /
          quizAttempts.length
        : 0;

    // Get video watch statistics
    const videoLessons = allLessons.filter((l) => l.type === 'video');
    const videoProgress = await this.videoProgressRepository.find({
      where: {
        userId,
        video: { lessonId: videoLessons.map((l) => l.id) as any },
      },
    });

    const videosWatched = videoProgress.filter((vp) => vp.isCompleted).length;
    const totalVideoWatchTime = videoProgress.reduce(
      (sum, vp) => sum + (vp.watchTime || 0),
      0,
    );

    // Calculate total time spent
    const quizTime = quizAttempts.reduce(
      (sum, qa) => sum + (qa.timeSpent || 0),
      0,
    );
    const totalTimeSpent = totalVideoWatchTime + quizTime;

    // Calculate overall progress
    const overallProgress =
      allLessons.length > 0 ? (completedLessons / allLessons.length) * 100 : 0;

    // Determine status
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completedLessons === allLessons.length && allLessons.length > 0) {
      status = 'completed';
    } else if (completedLessons > 0) {
      status = 'in_progress';
    }

    // Estimate completion date based on current pace
    const estimatedCompletionDate = this.estimateCompletionDate(
      enrollment,
      overallProgress,
      totalTimeSpent,
    );

    return {
      enrollmentId: enrollment.id,
      courseId,
      courseTitle: course.title,
      overallProgress,
      completedLessons,
      totalLessons: allLessons.length,
      completedModules,
      totalModules: modules.length,
      quizzesCompleted: passedQuizzes,
      totalQuizzes: quizLessons.length,
      videosWatched,
      totalVideos: videoLessons.length,
      averageQuizScore,
      totalTimeSpent,
      lastActivity: enrollment.updatedAt,
      estimatedCompletionDate,
      status,
    };
  }

  /**
   * Get progress for each module in a course
   */
  async getModuleProgress(
    enrollmentId: number,
    modules: CourseModule[],
  ): Promise<ModuleProgress[]> {
    const lessonProgress = await this.lessonProgressRepository.find({
      where: { enrollmentId },
    });

    return modules.map((module) => {
      const moduleLessons = module.lessons || [];
      const completedLessons = moduleLessons.filter((lesson) =>
        lessonProgress.some(
          (lp) => lp.lessonId === lesson.id && lp.status === 'completed',
        ),
      ).length;

      const progress =
        moduleLessons.length > 0
          ? (completedLessons / moduleLessons.length) * 100
          : 0;

      return {
        moduleId: module.id,
        moduleName: module.title,
        progress,
        completedLessons,
        totalLessons: moduleLessons.length,
        isCompleted: progress === 100,
      };
    });
  }

  /**
   * Get detailed progress for each lesson
   */
  async getLessonProgressDetails(
    enrollmentId: number,
    userId: number,
  ): Promise<LessonProgressDetail[]> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'course.modules', 'course.modules.lessons'],
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons || []);
    const lessonProgress = await this.lessonProgressRepository.find({
      where: { enrollmentId },
    });

    const details: LessonProgressDetail[] = [];

    for (const lesson of allLessons) {
      const progress = lessonProgress.find((lp) => lp.lessonId === lesson.id);

      let timeSpent: number | undefined;
      let quizScore: number | undefined;

      // Get video time if video lesson
      if (lesson.type === 'video' && lesson.videoUrl) {
        const videoProgress = await this.videoProgressRepository.findOne({
          where: { userId, videoId: lesson.id }, // Assuming videoId matches lessonId
        });
        timeSpent = videoProgress?.watchTime;
      }

      // Get quiz score if quiz lesson
      if (lesson.type === 'quiz') {
        const quizAttempts = await this.quizAttemptRepository.find({
          where: {
            userId,
            quiz: { lessonId: lesson.id } as any,
            status: 'completed',
          },
          order: { scorePercentage: 'DESC' },
        });
        if (quizAttempts.length > 0) {
          quizScore = quizAttempts[0].scorePercentage;
        }
      }

      details.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonType: lesson.type,
        status: progress?.status || 'not_started',
        progress: progress
          ? progress.status === 'completed'
            ? 100
            : 50
          : 0,
        timeSpent,
        quizScore,
        lastAccessed: progress?.updatedAt,
        completedAt: progress?.completedAt,
      });
    }

    return details;
  }

  /**
   * Get user's overall learning path progress
   */
  async getLearningPath(userId: number): Promise<LearningPath> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
    });

    const coursesInProgress = enrollments.filter(
      (e) => e.status === 'active',
    ).length;
    const coursesCompleted = enrollments.filter(
      (e) => e.status === 'completed',
    ).length;

    // Get all lesson progress
    const allLessonProgress = await this.lessonProgressRepository.find({
      where: {
        enrollment: { userId } as any,
        status: 'completed',
      },
    });

    // Get all quiz attempts
    const allQuizAttempts = await this.quizAttemptRepository.find({
      where: { userId, status: 'completed' },
    });

    const averageQuizScore =
      allQuizAttempts.length > 0
        ? allQuizAttempts.reduce((sum, qa) => sum + qa.scorePercentage, 0) /
          allQuizAttempts.length
        : 0;

    // Calculate total learning time
    const videoProgress = await this.videoProgressRepository.find({
      where: { userId },
    });

    const videoTime = videoProgress.reduce(
      (sum, vp) => sum + (vp.watchTime || 0),
      0,
    );
    const quizTime = allQuizAttempts.reduce(
      (sum, qa) => sum + (qa.timeSpent || 0),
      0,
    );

    // Calculate learning streak
    const { currentStreak, longestStreak } = this.calculateLearningStreak(
      enrollments,
      allLessonProgress,
    );

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId, 10);

    const lastActivityDate =
      recentActivity.length > 0
        ? recentActivity[0].date
        : enrollments[0]?.updatedAt || new Date();

    return {
      userId,
      totalCoursesEnrolled: enrollments.length,
      coursesInProgress,
      coursesCompleted,
      totalLessonsCompleted: allLessonProgress.length,
      totalQuizzesTaken: allQuizAttempts.length,
      averageQuizScore,
      totalLearningTime: videoTime + quizTime,
      certificatesEarned: coursesCompleted, // TODO: Link with actual certificates
      currentStreak,
      longestStreak,
      lastActivityDate,
      recentActivity,
    };
  }

  /**
   * Calculate learning streak (consecutive days of activity)
   */
  private calculateLearningStreak(
    enrollments: Enrollment[],
    lessonProgress: LessonProgress[],
  ): { currentStreak: number; longestStreak: number } {
    // Get all activity dates
    const activityDates = [
      ...enrollments.map((e) => e.updatedAt),
      ...lessonProgress.map((lp) => lp.updatedAt),
    ]
      .map((date) => date.toISOString().split('T')[0]) // Get date part only
      .sort()
      .reverse();

    // Remove duplicates
    const uniqueDates = [...new Set(activityDates)];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    let expectedDate = today;

    for (const date of uniqueDates) {
      if (date === expectedDate) {
        tempStreak++;
        if (date === today || currentStreak > 0) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calculate previous day
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        expectedDate = prevDate.toISOString().split('T')[0];
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Get recent learning activity
   */
  private async getRecentActivity(
    userId: number,
    limit = 10,
  ): Promise<Array<{ date: Date; activityType: string; description: string }>> {
    const activities: Array<{
      date: Date;
      activityType: string;
      description: string;
    }> = [];

    // Get recent lesson completions
    const recentLessons = await this.lessonProgressRepository.find({
      where: {
        enrollment: { userId } as any,
        status: 'completed',
      },
      order: { completedAt: 'DESC' },
      take: limit,
      relations: ['lesson'],
    });

    recentLessons.forEach((lp) => {
      if (lp.completedAt) {
        activities.push({
          date: lp.completedAt,
          activityType: 'lesson_completed',
          description: `Completed lesson: ${lp.lesson?.title || 'Unknown'}`,
        });
      }
    });

    // Get recent quiz attempts
    const recentQuizzes = await this.quizAttemptRepository.find({
      where: { userId, status: 'completed' },
      order: { submittedAt: 'DESC' },
      take: limit,
      relations: ['quiz'],
    });

    recentQuizzes.forEach((qa) => {
      if (qa.submittedAt) {
        activities.push({
          date: qa.submittedAt,
          activityType: 'quiz_completed',
          description: `Completed quiz: ${qa.quiz?.title || 'Unknown'} (Score: ${qa.scorePercentage.toFixed(0)}%)`,
        });
      }
    });

    // Sort by date and limit
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }

  /**
   * Estimate course completion date based on current pace
   */
  private estimateCompletionDate(
    enrollment: Enrollment,
    currentProgress: number,
    totalTimeSpent: number,
  ): Date | undefined {
    if (currentProgress >= 100) {
      return undefined;
    }

    const daysSinceEnrollment = Math.max(
      1,
      Math.floor(
        (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const progressPerDay = currentProgress / daysSinceEnrollment;

    if (progressPerDay <= 0) {
      return undefined;
    }

    const remainingProgress = 100 - currentProgress;
    const estimatedDaysRemaining = Math.ceil(remainingProgress / progressPerDay);

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDaysRemaining);

    return estimatedDate;
  }

  /**
   * Mark lesson as started
   */
  async startLesson(enrollmentId: number, lessonId: number): Promise<void> {
    const existing = await this.lessonProgressRepository.findOne({
      where: { enrollmentId, lessonId },
    });

    if (!existing) {
      await this.lessonProgressRepository.save({
        enrollmentId,
        lessonId,
        status: 'in_progress',
      });
    }
  }

  /**
   * Mark lesson as completed
   */
  async completeLesson(enrollmentId: number, lessonId: number): Promise<void> {
    const existing = await this.lessonProgressRepository.findOne({
      where: { enrollmentId, lessonId },
    });

    if (existing) {
      existing.status = 'completed';
      existing.completedAt = new Date();
      await this.lessonProgressRepository.save(existing);
    } else {
      await this.lessonProgressRepository.save({
        enrollmentId,
        lessonId,
        status: 'completed',
        completedAt: new Date(),
      });
    }

    // Check if course is completed
    await this.checkCourseCompletion(enrollmentId);
  }

  /**
   * Check if all lessons in a course are completed
   */
  private async checkCourseCompletion(enrollmentId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['course', 'course.modules', 'course.modules.lessons'],
    });

    if (!enrollment) return;

    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons || []);
    const lessonProgress = await this.lessonProgressRepository.find({
      where: { enrollmentId },
    });

    const completedLessons = lessonProgress.filter(
      (lp) => lp.status === 'completed',
    ).length;

    if (completedLessons === allLessons.length && allLessons.length > 0) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
      await this.enrollmentRepository.save(enrollment);
    } else {
      enrollment.progress = (completedLessons / allLessons.length) * 100;
      await this.enrollmentRepository.save(enrollment);
    }
  }
}
