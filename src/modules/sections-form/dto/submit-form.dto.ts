import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';

class DynamicField {
  @IsNotEmpty()
  value: string | number | string[] | object; // Hỗ trợ các loại giá trị khác nhau
}

export class SubmitFormDto {
  @IsString()
  @IsNotEmpty()
  form_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsInt()
  @IsOptional()
  university?: number;

  @Transform(({ obj }) => obj)
  rawData: any;
}
