import { IsString } from 'class-validator';

export class QueryByFormDto {
  @IsString()
  form_id: string;
}
