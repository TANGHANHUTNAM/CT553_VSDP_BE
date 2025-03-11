import { PartialType } from '@nestjs/mapped-types';
import { ApplicantStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class QueryPaginationFormResponseDto extends PartialType(QueryParams) {
  @IsString()
  @IsNotEmpty()
  formId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  universityId?: number;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ascend' | 'descend';

  @IsObject()
  @IsOptional()
  filters?: Record<string, string[]>;

  @IsOptional()
  @IsEnum(ApplicantStatus)
  @IsString()
  status?: string;
}
