import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class UniversityQuery extends PartialType(QueryParams) {
  @IsOptional()
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  sortByUpdatedAt: string;
}
