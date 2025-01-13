import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: string, token: string) {
    const url = `example.com/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user,
      // from: '"Support Team" <support@example.com>', // override default from
      //   subject: 'Welcome to Nice App! Confirm your Email',
      template: './test',
      context: {
        name: user,
        url,
      },
    });
  }
}
