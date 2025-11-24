import { IsString, IsEnum, IsNumber, IsOptional, MinLength, MaxLength } from 'class-validator';
import { CommentableType } from '../entities/comment.entity';

export class CreateCommentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  content: string;

  @IsEnum(CommentableType)
  commentableType: CommentableType;

  @IsNumber()
  commentableId: number;

  @IsOptional()
  @IsNumber()
  parentCommentId?: number;
}
