import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class FileDto {
  @IsString()
  originalname: string;

  @IsString()
  mimetype: string;

  @IsString()
  buffer: Buffer;
}

export class UpdateFormUploadImage {
  @IsOptional()
  @Type(() => FileDto)
  file: FileDto;

  @IsOptional()
  @IsString()
  public_id: string;

  @IsString()
  @IsNotEmpty()
  primary_color: string;

  @IsString()
  @IsNotEmpty()
  block_color: string;

  @IsString()
  @IsNotEmpty()
  background_color: string;
}
