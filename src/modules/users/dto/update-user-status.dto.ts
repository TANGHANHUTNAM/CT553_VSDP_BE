import { IsNumber, IsNotEmpty } from 'class-validator';

export class updateUserStatusDto {
  @IsNotEmpty()
  @IsNumber()
  status: number;
}
