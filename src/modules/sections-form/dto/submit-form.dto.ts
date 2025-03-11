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
  form_id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone_number: string;

  @IsInt()
  university?: number;

  @Transform(({ obj }) => obj)
  rawData: any;
}
