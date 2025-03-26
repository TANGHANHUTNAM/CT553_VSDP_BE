import { IsNumber, IsString } from 'class-validator';

export class CreateScoringSectionDto {
  @IsString()
  form_id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  max_score: number;
}
