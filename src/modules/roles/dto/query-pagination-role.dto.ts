import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class RoleQuery extends PartialType(QueryParams) {
  @IsOptional()
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  sortByUpdatedAt: string;
}
