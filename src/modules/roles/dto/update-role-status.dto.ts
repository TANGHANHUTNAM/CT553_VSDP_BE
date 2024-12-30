import { IsNumber, IsNotEmpty } from 'class-validator';

export class updateRoleStatusDto {
  @IsNotEmpty()
  @IsNumber()
  status: number;
}
