import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum GroupBy {
  DAY = 'day',
  MONTH = 'month',
}

export class GetStatsDto {
  @IsString()
  form_id: string;

  @IsOptional()
  @IsEnum(GroupBy)
  group_by?: GroupBy = GroupBy.DAY;

  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}
