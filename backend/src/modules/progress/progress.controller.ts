import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * Progress tracking and analytics endpoints
 */
@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get course progress for current user' })
  @ApiResponse({ status: 200, description: 'Course progress data' })
  async getCourseProgress(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: User,
  ) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Get('enrollments/:enrollmentId/modules')
  @ApiOperation({ summary: 'Get progress for each module in enrollment' })
  @ApiResponse({ status: 200, description: 'Module progress data' })
  async getModuleProgress(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @CurrentUser() user: User,
  ) {
    const enrollment = { id: enrollmentId }; // TODO: Verify user owns this enrollment
    const modules = []; // TODO: Load modules
    return this.progressService.getModuleProgress(enrollmentId, modules);
  }

  @Get('enrollments/:enrollmentId/lessons')
  @ApiOperation({ summary: 'Get detailed progress for each lesson' })
  @ApiResponse({ status: 200, description: 'Lesson progress details' })
  async getLessonProgress(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @CurrentUser() user: User,
  ) {
    return this.progressService.getLessonProgressDetails(enrollmentId, user.id);
  }

  @Get('learning-path')
  @ApiOperation({ summary: 'Get overall learning path progress' })
  @ApiResponse({ status: 200, description: 'Learning path data' })
  async getLearningPath(@CurrentUser() user: User) {
    return this.progressService.getLearningPath(user.id);
  }

  @Post('enrollments/:enrollmentId/lessons/:lessonId/start')
  @ApiOperation({ summary: 'Mark lesson as started' })
  @ApiResponse({ status: 200, description: 'Lesson marked as started' })
  async startLesson(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    await this.progressService.startLesson(enrollmentId, lessonId);
    return { message: 'Lesson started' };
  }

  @Post('enrollments/:enrollmentId/lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark lesson as completed' })
  @ApiResponse({ status: 200, description: 'Lesson marked as completed' })
  async completeLesson(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    await this.progressService.completeLesson(enrollmentId, lessonId);
    return { message: 'Lesson completed' };
  }
}
