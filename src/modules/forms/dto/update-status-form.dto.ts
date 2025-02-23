import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateStatusFormDto {
  @IsBoolean()
  @IsNotEmpty()
  is_default: boolean;
}
