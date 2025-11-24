import { IsString, IsNumber, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateForumPostDto {
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  content: string;

  @IsNumber()
  topicId: number;

  @IsOptional()
  @IsNumber()
  replyToId?: number;
}
