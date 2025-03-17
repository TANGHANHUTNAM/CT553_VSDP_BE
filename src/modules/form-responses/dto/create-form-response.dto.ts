import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
export class CreateFormResponseDto {
  @IsString()
  form_id: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone_number: string;

  @IsOptional()
  @IsInt()
  university?: number;

  @Transform(({ obj }) => obj)
  rawData: any;
}
