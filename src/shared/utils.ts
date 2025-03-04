import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class QueryParams {
  @IsString()
  search: string;

  @IsInt()
  @Type(() => Number)
  current?: number;

  @IsInt()
  @Type(() => Number)
  pageSize?: number;
}
