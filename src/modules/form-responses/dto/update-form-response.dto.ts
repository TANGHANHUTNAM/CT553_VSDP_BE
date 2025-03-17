import { PartialType } from '@nestjs/mapped-types';
import { CreateFormResponseDto } from './create-form-response.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicantStatus, Prisma } from '@prisma/client';

export class UpdateFormResponseDto extends PartialType(CreateFormResponseDto) {
  @IsOptional()
  @IsEnum(ApplicantStatus)
  status?: ApplicantStatus;

  dynamic_fields: Record<string, unknown>;
}
