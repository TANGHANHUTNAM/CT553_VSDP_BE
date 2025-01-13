import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

class FileDto {
  @IsString()
  originalname: string;

  @IsString()
  mimetype: string;

  @IsString()
  buffer: Buffer;
}

export class UploadAvatarUserDto {
  @Type(() => FileDto)
  file: FileDto;

  @IsOptional()
  @IsString()
  public_id: string;
}
