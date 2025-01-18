import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { LogService } from './log/log.service';
import { MailService } from './mail/mail.service';
@UseInterceptors(CacheInterceptor)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cloudinaryService: CloudinaryService,
    private mailSendService: MailService,
    private logService: LogService,
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
  // fakeModel = {
  //   id: 1,
  //   name: 'John Doeeee',
  //   email: 'okee@gmail.com',
  //   phone: '123456789',
  //   address: '123 Main St',
  //   createdAt: new Date(),
  // };

  // @Get('auto-caching')
  // @CacheKey('auto-caching-fake-model')
  // @CacheTTL(60000)
  // getAutoCaching() {
  //   return this.fakeModel;
  // }

  // @Get('manual-caching')
  // async getManualCaching() {
  //   const cacheKey = 'manual-caching-fake-model';
  //   const cacheValue = await this.redisService.getClient().get(cacheKey);
  //   if (cacheValue) {
  //     return JSON.parse(cacheValue);
  //   }
  //   await this.redisService
  //     .getClient()
  //     .set(cacheKey, JSON.stringify(this.fakeModel), 'EX', 10);
  //   return this.fakeModel;
  // }
}
