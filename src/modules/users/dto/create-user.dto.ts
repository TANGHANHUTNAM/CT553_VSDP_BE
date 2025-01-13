import { IsString, IsEmail, IsNotEmpty, IsInt } from 'class-validator';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsInt()
  @IsNotEmpty()
  roleId: number;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;
}
