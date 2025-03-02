import { Body, Controller, Delete, Post } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ResMessage } from 'src/common/decorators/response.decorator';
import { DeleteFileCloudinaryDto } from './delete-file-cloudinary.dto';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Public()
  @ResMessage('Xóa ảnh thành công!')
  @Delete('file/delete')
  deleteImage(@Body() data: DeleteFileCloudinaryDto) {
    const { public_id } = data;
    return this.cloudinaryService.deleteFile(public_id);
  }
}
