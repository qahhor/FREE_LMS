import { IsString, IsNumber, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateForumTopicDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  content: string;

  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
