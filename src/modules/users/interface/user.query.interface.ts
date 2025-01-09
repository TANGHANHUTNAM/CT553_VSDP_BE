import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class UserQuery extends PartialType(QueryParams) {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  role: Number;
  @IsOptional()
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  sortByUpdatedAt: string;
}
