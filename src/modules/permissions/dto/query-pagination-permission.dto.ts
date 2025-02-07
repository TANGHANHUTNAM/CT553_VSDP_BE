import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { QueryParams } from 'src/shared/utils';

export class PermssionQuery extends PartialType(QueryParams) {
  @IsOptional()
  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  sortByUpdatedAt: string;
}
