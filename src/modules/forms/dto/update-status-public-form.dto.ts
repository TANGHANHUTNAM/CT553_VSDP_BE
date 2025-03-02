import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusPublicFormDto {
  @IsNotEmpty()
  @IsBoolean()
  is_public: boolean;
}
