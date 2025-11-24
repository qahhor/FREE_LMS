import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { RateLimitInterceptor } from '../interceptors/rate-limit.interceptor';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../courses/entities/enrollment.entity';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * Public API for integrations
 * Requires API key authentication
 * All endpoints are rate-limited
 */
@Controller('api/v1')
@UseGuards(ApiKeyGuard)
@UseInterceptors(RateLimitInterceptor)
export class ApiController {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  /**
   * Get API status
   */
  @Get('status')
  @RateLimit(100, 60) // 100 requests per minute
  getStatus(@Req() req: any) {
    return {
      status: 'ok',
      version: '1.0.0',
      organization: {
        id: req.organization.id,
        name: req.organization.name,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * List courses
   */
  @Get('courses')
  @RateLimit(60, 60) // 60 requests per minute
  async listCourses(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    const skip = (page - 1) * limit;

    const [courses, total] = await this.courseRepository.findAndCount({
      where: {
        instructorId: req.organization.ownerId,
        ...(status && { status }),
      },
      take: limit,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        price: c.price,
        status: c.status,
        enrollmentCount: c.enrollmentCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get course by ID
   */
  @Get('courses/:id')
  @RateLimit(100, 60)
  async getCourse(@Req() req: any, @Param('id') id: number) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['sections', 'sections.lessons'],
    });

    if (!course) {
      return { error: 'Course not found' };
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      status: course.status,
      language: course.language,
      level: course.level,
      duration: course.duration,
      enrollmentCount: course.enrollmentCount,
      sections: course.sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        lessons: s.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          duration: l.duration,
          order: l.order,
        })),
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  /**
   * Create course
   */
  @Post('courses')
  @RateLimit(30, 60) // 30 requests per minute
  async createCourse(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      slug: string;
      description: string;
      thumbnail?: string;
      price?: number;
      language?: string;
      level?: string;
    },
  ) {
    const course = this.courseRepository.create({
      ...body,
      instructorId: req.organization.ownerId,
      status: 'draft',
    });

    await this.courseRepository.save(course);

    return {
      success: true,
      data: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        createdAt: course.createdAt,
      },
    };
  }

  /**
   * Update course
   */
  @Patch('courses/:id')
  @RateLimit(30, 60)
  async updateCourse(
    @Req() req: any,
    @Param('id') id: number,
    @Body() body: Partial<Course>,
  ) {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      return { error: 'Course not found' };
    }

    Object.assign(course, body);
    await this.courseRepository.save(course);

    return {
      success: true,
      data: {
        id: course.id,
        title: course.title,
        updatedAt: course.updatedAt,
      },
    };
  }

  /**
   * List users/students
   */
  @Get('users')
  @RateLimit(60, 60)
  async listUsers(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('role') role?: string,
  ) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: {
        ...(role && { role }),
      },
      take: limit,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  @Get('users/:id')
  @RateLimit(100, 60)
  async getUser(@Param('id') id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Create user
   */
  @Post('users')
  @RateLimit(30, 60)
  async createUser(
    @Body()
    body: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role?: string;
    },
  ) {
    // Check if user exists
    const existing = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (existing) {
      return { error: 'User already exists' };
    }

    const user = this.userRepository.create({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password, // Should be hashed
      role: body.role || 'student',
      isActive: true,
    });

    await this.userRepository.save(user);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Enroll user in course
   */
  @Post('enrollments')
  @RateLimit(60, 60)
  async createEnrollment(
    @Body() body: { userId: number; courseId: number; enrolledBy?: string },
  ) {
    // Check if already enrolled
    const existing = await this.enrollmentRepository.findOne({
      where: {
        userId: body.userId,
        courseId: body.courseId,
      },
    });

    if (existing) {
      return { error: 'User already enrolled' };
    }

    const enrollment = this.enrollmentRepository.create({
      userId: body.userId,
      courseId: body.courseId,
      enrolledBy: body.enrolledBy || 'api',
      progress: 0,
      status: 'active',
    });

    await this.enrollmentRepository.save(enrollment);

    return {
      success: true,
      data: {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
    };
  }

  /**
   * Get user enrollments
   */
  @Get('users/:userId/enrollments')
  @RateLimit(60, 60)
  async getUserEnrollments(@Param('userId') userId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
      order: { enrolledAt: 'DESC' },
    });

    return {
      data: enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        courseTitle: e.course.title,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
      })),
    };
  }

  /**
   * Update enrollment progress
   */
  @Patch('enrollments/:id')
  @RateLimit(100, 60)
  async updateEnrollment(
    @Param('id') id: number,
    @Body() body: { progress?: number; status?: string },
  ) {
    const enrollment = await this.enrollmentRepository.findOne({ where: { id } });

    if (!enrollment) {
      return { error: 'Enrollment not found' };
    }

    if (body.progress !== undefined) {
      enrollment.progress = body.progress;
    }

    if (body.status) {
      enrollment.status = body.status as any;
      if (body.status === 'completed') {
        enrollment.completedAt = new Date();
      }
    }

    await this.enrollmentRepository.save(enrollment);

    return {
      success: true,
      data: {
        id: enrollment.id,
        progress: enrollment.progress,
        status: enrollment.status,
      },
    };
  }

  /**
   * Webhook receiver
   */
  @Post('webhooks')
  @RateLimit(100, 60)
  async receiveWebhook(@Req() req: any, @Body() body: any) {
    // Process webhook
    // This would trigger events based on webhook type

    return {
      success: true,
      received: true,
      timestamp: new Date().toISOString(),
    };
  }
}
