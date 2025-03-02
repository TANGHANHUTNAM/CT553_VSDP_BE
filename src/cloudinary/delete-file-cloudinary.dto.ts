import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteFileCloudinaryDto {
  @IsString()
  @IsNotEmpty()
  public_id: string;
}
