import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSectionVersionDto {
  @IsNumber()
  @IsNotEmpty()
  form_section_id: number;
}
