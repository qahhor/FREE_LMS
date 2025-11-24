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
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ForumService } from '../services';
import {
  CreateForumCategoryDto,
  CreateForumTopicDto,
  CreateForumPostDto,
  UpdateForumTopicDto,
  UpdateContentDto,
} from '../dto';
import { LikeableType } from '../entities';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ===== CATEGORIES =====

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createCategory(@Body() dto: CreateForumCategoryDto) {
    return await this.forumService.createCategory(dto);
  }

  @Get('categories')
  async getAllCategories() {
    return await this.forumService.getAllCategories();
  }

  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    return await this.forumService.getCategoryBySlug(slug);
  }

  // ===== TOPICS =====

  @Post('topics')
  @UseGuards(JwtAuthGuard)
  async createTopic(@Request() req, @Body() dto: CreateForumTopicDto) {
    return await this.forumService.createTopic(req.user.id, dto);
  }

  @Get('categories/:categoryId/topics')
  async getTopicsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.forumService.getTopicsByCategory(
      categoryId,
      pageNum,
      limitNum,
    );
  }

  @Get('topics/search')
  async searchTopics(
    @Query('q') query: string,
    @Query('category') categoryId?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    const tagsArray = tags ? tags.split(',') : undefined;

    return await this.forumService.searchTopics(
      query,
      categoryIdNum,
      tagsArray,
      pageNum,
      limitNum,
    );
  }

  @Get('topics/:slug')
  async getTopicBySlug(@Param('slug') slug: string) {
    return await this.forumService.getTopicBySlug(slug);
  }

  @Put('topics/:id')
  @UseGuards(JwtAuthGuard)
  async updateTopic(
    @Request() req,
    @Param('id', ParseIntPipe) topicId: number,
    @Body() dto: UpdateForumTopicDto,
  ) {
    return await this.forumService.updateTopic(req.user.id, topicId, dto);
  }

  @Delete('topics/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTopic(@Request() req, @Param('id', ParseIntPipe) topicId: number) {
    await this.forumService.deleteTopic(req.user.id, topicId);
  }

  @Put('topics/:id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async pinTopic(
    @Param('id', ParseIntPipe) topicId: number,
    @Body('isPinned') isPinned: boolean,
  ) {
    return await this.forumService.pinTopic(topicId, isPinned);
  }

  @Put('topics/:id/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  async lockTopic(
    @Param('id', ParseIntPipe) topicId: number,
    @Body('isLocked') isLocked: boolean,
  ) {
    return await this.forumService.lockTopic(topicId, isLocked);
  }

  // ===== POSTS =====

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(@Request() req, @Body() dto: CreateForumPostDto) {
    return await this.forumService.createPost(req.user.id, dto);
  }

  @Get('topics/:topicId/posts')
  async getPostsByTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.forumService.getPostsByTopic(topicId, pageNum, limitNum);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Request() req,
    @Param('id', ParseIntPipe) postId: number,
    @Body() dto: UpdateContentDto,
  ) {
    return await this.forumService.updatePost(req.user.id, postId, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Request() req, @Param('id', ParseIntPipe) postId: number) {
    await this.forumService.deletePost(req.user.id, postId);
  }

  @Put('posts/:id/best-answer')
  @UseGuards(JwtAuthGuard)
  async markBestAnswer(
    @Request() req,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return await this.forumService.markBestAnswer(postId, req.user.id);
  }

  // ===== LIKES =====

  @Post('like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @Request() req,
    @Body('type') type: LikeableType,
    @Body('id', ParseIntPipe) id: number,
  ) {
    return await this.forumService.toggleLike(req.user.id, type, id);
  }

  @Post('likes/check')
  @UseGuards(JwtAuthGuard)
  async getUserLikes(
    @Request() req,
    @Body('type') type: LikeableType,
    @Body('ids') ids: number[],
  ) {
    return await this.forumService.getUserLikes(req.user.id, type, ids);
  }

  // ===== TAGS =====

  @Get('tags/popular')
  async getPopularTags(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.forumService.getPopularTags(limitNum);
  }
}
