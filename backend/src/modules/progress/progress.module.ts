import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../enrollments/entities/lesson-progress.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import { VideoProgress } from '../video/entities/video-progress.entity';
import { CourseModule as CourseModuleEntity } from '../courses/entities/course-module.entity';
import { Lesson } from '../courses/entities/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      LessonProgress,
      QuizAttempt,
      VideoProgress,
      CourseModuleEntity,
      Lesson,
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
