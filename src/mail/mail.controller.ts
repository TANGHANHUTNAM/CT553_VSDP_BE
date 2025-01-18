import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import {
  IUserSendMail,
  IUserSendMailOtp,
} from './interfaces/user-account-creation-mail';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Post('send')
  sendMail(@Body() body: IUserSendMail[]) {
    return this.mailService.sendMail(body);
  }

  @Public()
  @Post('send-otp')
  sendMailOTP(@Body() body: IUserSendMailOtp) {
    return this.mailService.sendMailOtpChangePassword(body);
  }
}
