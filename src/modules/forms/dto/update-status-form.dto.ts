import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateStatusFormDto {
  @IsNumber()
  @IsNotEmpty()
  status: number;
}
