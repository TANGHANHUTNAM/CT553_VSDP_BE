import { IsNotEmpty, IsString } from 'class-validator';

export class PayloadChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  new_password: string;
  @IsString()
  @IsNotEmpty()
  temp_token: string;
}
