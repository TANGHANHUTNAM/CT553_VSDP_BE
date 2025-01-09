import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  company: string;
  @IsString()
  @IsOptional()
  date_of_birth: string;
  @IsString()
  @IsOptional()
  gender: string;
  @IsString()
  @IsOptional()
  generation: string;
  @IsBoolean()
  @IsOptional()
  is_external_guest: boolean;
  @IsString()
  @IsOptional()
  major: string;
  @IsString()
  @IsOptional()
  phone_number: string;
  @IsString()
  @IsOptional()
  school: string;
}
