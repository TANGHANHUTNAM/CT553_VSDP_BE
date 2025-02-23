import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectionsFormDto {
  @IsString()
  @IsNotEmpty()
  form_id: string;
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  description: string;
}
