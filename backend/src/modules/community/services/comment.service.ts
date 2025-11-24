import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Comment, CommentableType, Like, LikeableType } from '../entities';
import { CreateCommentDto, UpdateContentDto } from '../dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  async createComment(userId: number, dto: CreateCommentDto): Promise<Comment> {
    // If replying to a comment, verify parent exists
    if (dto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Verify parent is on the same commentable
      if (
        parentComment.commentableType !== dto.commentableType ||
        parentComment.commentableId !== dto.commentableId
      ) {
        throw new BadRequestException(
          'Parent comment does not belong to the same content',
        );
      }
    }

    // Create comment
    const comment = this.commentRepository.create({
      content: dto.content,
      authorId: userId,
      commentableType: dto.commentableType,
      commentableId: dto.commentableId,
      parentCommentId: dto.parentCommentId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Update parent comment reply count
    if (dto.parentCommentId) {
      await this.commentRepository.increment(
        { id: dto.parentCommentId },
        'repliesCount',
        1,
      );
    }

    return savedComment;
  }

  async getComments(
    commentableType: CommentableType,
    commentableId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Comment[]; total: number }> {
    // Get top-level comments (no parent)
    const [data, total] = await this.commentRepository.findAndCount({
      where: {
        commentableType,
        commentableId,
        parentCommentId: null,
      },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getReplies(
    parentCommentId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Comment[]; total: number }> {
    const [data, total] = await this.commentRepository.findAndCount({
      where: { parentCommentId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async updateComment(
    userId: number,
    commentId: number,
    dto: UpdateContentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    return await this.commentRepository.save(comment);
  }

  async deleteComment(userId: number, commentId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete all replies to this comment
    await this.commentRepository.delete({ parentCommentId: commentId });

    // Delete the comment
    await this.commentRepository.delete({ id: commentId });

    // Update parent comment reply count if this was a reply
    if (comment.parentCommentId) {
      await this.commentRepository.decrement(
        { id: comment.parentCommentId },
        'repliesCount',
        1,
      );
    }
  }

  async toggleLike(
    userId: number,
    commentId: number,
  ): Promise<{ liked: boolean; likesCount: number }> {
    // Check if comment exists
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if already liked
    const existingLike = await this.likeRepository.findOne({
      where: {
        userId,
        likeableType: LikeableType.COMMENT,
        likeableId: commentId,
      },
    });

    let liked: boolean;

    if (existingLike) {
      // Unlike
      await this.likeRepository.delete({ id: existingLike.id });
      await this.commentRepository.decrement({ id: commentId }, 'likesCount', 1);
      liked = false;
    } else {
      // Like
      const like = this.likeRepository.create({
        userId,
        likeableType: LikeableType.COMMENT,
        likeableId: commentId,
      });
      await this.likeRepository.save(like);
      await this.commentRepository.increment({ id: commentId }, 'likesCount', 1);
      liked = true;
    }

    // Get updated likes count
    const updatedComment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    const likesCount = updatedComment?.likesCount || 0;

    return { liked, likesCount };
  }

  async getUserLikes(userId: number, commentIds: number[]): Promise<number[]> {
    const likes = await this.likeRepository.find({
      where: {
        userId,
        likeableType: LikeableType.COMMENT,
        likeableId: In(commentIds),
      },
    });

    return likes.map((like) => like.likeableId);
  }

  async getCommentById(commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async getCommentsCount(
    commentableType: CommentableType,
    commentableId: number,
  ): Promise<number> {
    return await this.commentRepository.count({
      where: {
        commentableType,
        commentableId,
      },
    });
  }
}
