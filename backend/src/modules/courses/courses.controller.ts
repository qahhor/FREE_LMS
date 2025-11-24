import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { Cacheable, InvalidateCache } from '../../common/decorators/cacheable.decorator';
import { RateLimit } from '../../common/guards/rate-limit.guard';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @RateLimit(10, 60) // 10 courses per minute
  @InvalidateCache('courses:list', 'courses:search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
  ): Promise<Course> {
    return this.coursesService.create(createCourseDto, user.id);
  }

  @Get()
  @Cacheable('courses:list', 300) // Cache for 5 minutes
  @RateLimit(100, 60) // 100 requests per minute
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiResponse({ status: 200, description: 'Courses list' })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<{ data: Course[]; total: number }> {
    return this.coursesService.findAll(page, limit);
  }

  @Get('search')
  @Cacheable('courses:search', 180) // Cache for 3 minutes
  @RateLimit(50, 60) // 50 searches per minute
  @ApiOperation({ summary: 'Search courses with filters' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('categoryId') categoryId?: number,
    @Query('level') level?: string,
    @Query('isFree') isFree?: string,
    @Query('minRating') minRating?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ data: Course[]; total: number }> {
    return this.coursesService.search(
      query || '',
      {
        categoryId: categoryId ? +categoryId : undefined,
        level,
        isFree: isFree === 'true' ? true : isFree === 'false' ? false : undefined,
        minRating: minRating ? +minRating : undefined,
      },
      +page,
      +limit,
    );
  }

  @Get(':id')
  @Cacheable('courses:detail', 600) // Cache for 10 minutes
  @RateLimit(200, 60) // 200 requests per minute
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Course> {
    return this.coursesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @RateLimit(20, 60) // 20 updates per minute
  @InvalidateCache('courses:list', 'courses:search', 'courses:detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @RateLimit(10, 60)
  @InvalidateCache('courses:list', 'courses:search', 'courses:detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish course' })
  @ApiResponse({ status: 200, description: 'Course published successfully' })
  async publish(@Param('id', ParseIntPipe) id: number): Promise<Course> {
    return this.coursesService.publish(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @RateLimit(5, 60) // 5 deletions per minute
  @InvalidateCache('courses:list', 'courses:search', 'courses:detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.coursesService.remove(id);
    return { message: 'Course deleted successfully' };
  }
}
