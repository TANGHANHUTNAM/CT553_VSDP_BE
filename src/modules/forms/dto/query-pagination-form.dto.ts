import { PartialType } from '@nestjs/mapped-types';
import { Scope } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class QueryForm extends PartialType(QueryParams) {
  @IsOptional()
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  scope: string;
}
