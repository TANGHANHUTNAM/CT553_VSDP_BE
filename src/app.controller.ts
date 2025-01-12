import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './config/multer.config';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file', multerOptions))
  // async uploadImage(@UploadedFile() file: Express.Multer.File) {
  //   try {
  //     const result = await this.cloudinaryService.uploadFile(file);
  //     return {
  //       url: result.secure_url,
  //       public_id: result.public_id,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
