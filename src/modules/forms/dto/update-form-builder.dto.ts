import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateFormBuilderDto {
  @IsString()
  @IsNotEmpty()
  primary_color: string;
  @IsString()
  @IsNotEmpty()
  block_color: string;
  @IsString()
  @IsNotEmpty()
  background_color: string;
  @IsArray()
  @Type(() => Object)
  @IsNotEmpty()
  json_blocks: Record<string, any>[];
}
