import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { IUserSendMail } from './interfaces/user-account-creation-mail';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  sendMail(@Body() body: IUserSendMail[]) {
    return this.mailService.sendMail(body);
  }
}
