import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class QuizQuestionOptionDto {
  @IsString()
  label: string;

  @IsString()
  text: string;
}

class QuizQuestionDto {
  @IsString()
  id: string;

  @IsString()
  prompt: string;

  @IsString()
  type: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionOptionDto)
  options: QuizQuestionOptionDto[];

  @IsArray()
  @IsString({ each: true })
  correctAnswers: string[];

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateContentDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsString()
  partId?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsString()
  quizMode?: string;

  @IsOptional()
  @IsString()
  quizDifficulty?: string;

  @IsOptional()
  @IsString()
  quizSourceChapter?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quizAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  quizPassingScore?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quizQuestionCount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  quizQuestions?: QuizQuestionDto[];
}
