import { Scope } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
  @IsString()
  @IsNotEmpty()
  start_date: string;
  @IsString()
  @IsNotEmpty()
  end_date: string;
  @IsString()
  @IsNotEmpty()
  @IsEnum(Scope, { message: 'scope must be a valid enum value' })
  scope: Scope;
  @IsNumber()
  @IsNotEmpty()
  creator_id: number;
  @IsString()
  @IsNotEmpty()
  creator_name: string;
}
