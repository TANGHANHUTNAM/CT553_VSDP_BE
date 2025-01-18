import { IsNotEmpty, IsString, Length } from 'class-validator';

export class PayloadAuthOtpDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
