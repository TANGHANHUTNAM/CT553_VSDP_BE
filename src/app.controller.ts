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
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail/mail.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudinaryService: CloudinaryService,
    private maileService: MailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/test')
  async sendMail() {
    try {
      await this.maileService.sendUserConfirmation(
        'namtanghanhut@gmail.com',
        'token here>>>>>>>>>>>>>>>1231232132131',
      );
    } catch (error) {
      throw error;
    }
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
