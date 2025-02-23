import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionVersionDto } from './create-section-version.dto';
import { IsArray, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSectionVersionDto extends PartialType(
  CreateSectionVersionDto,
) {
  @IsArray()
  @Type(() => Object)
  @IsNotEmpty()
  json_blocks: Record<string, any>[];
}
