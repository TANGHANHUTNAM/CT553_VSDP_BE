import { PartialType } from '@nestjs/mapped-types';
import { CreateUniversityDto } from './create-university.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUniversityDto extends PartialType(CreateUniversityDto) {
  @IsOptional()
  @IsBoolean()
  is_active: boolean;
}
