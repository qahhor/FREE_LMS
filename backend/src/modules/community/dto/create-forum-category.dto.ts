import { IsString, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreateForumCategoryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
