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
import { CommentService } from '../services';
import { CreateCommentDto, UpdateContentDto } from '../dto';
import { CommentableType } from '../entities';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(@Request() req, @Body() dto: CreateCommentDto) {
    return await this.commentService.createComment(req.user.id, dto);
  }

  @Get()
  async getComments(
    @Query('type') type: CommentableType,
    @Query('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.commentService.getComments(type, id, pageNum, limitNum);
  }

  @Get(':id/replies')
  async getReplies(
    @Param('id', ParseIntPipe) commentId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.commentService.getReplies(commentId, pageNum, limitNum);
  }

  @Get(':id')
  async getCommentById(@Param('id', ParseIntPipe) commentId: number) {
    return await this.commentService.getCommentById(commentId);
  }

  @Get('count')
  async getCommentsCount(
    @Query('type') type: CommentableType,
    @Query('id', ParseIntPipe) id: number,
  ) {
    const count = await this.commentService.getCommentsCount(type, id);
    return { count };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Request() req,
    @Param('id', ParseIntPipe) commentId: number,
    @Body() dto: UpdateContentDto,
  ) {
    return await this.commentService.updateComment(req.user.id, commentId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Request() req,
    @Param('id', ParseIntPipe) commentId: number,
  ) {
    await this.commentService.deleteComment(req.user.id, commentId);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Request() req, @Param('id', ParseIntPipe) commentId: number) {
    return await this.commentService.toggleLike(req.user.id, commentId);
  }

  @Post('likes/check')
  @UseGuards(JwtAuthGuard)
  async getUserLikes(@Request() req, @Body('ids') ids: number[]) {
    return await this.commentService.getUserLikes(req.user.id, ids);
  }
}
