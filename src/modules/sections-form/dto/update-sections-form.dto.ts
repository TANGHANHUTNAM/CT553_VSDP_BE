import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionsFormDto } from './create-sections-form.dto';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSectionsFormDto extends PartialType(CreateSectionsFormDto) {
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  json_blocks: Record<string, any>[];
}
