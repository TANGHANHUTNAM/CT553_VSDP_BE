import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { LogService } from 'src/log/log.service';
import { EXCHANGE, ROUTING_KEY } from 'src/rabbitmq/rabbitmq-constant';
import {
  IUserSendMail,
  IUserSendMailOtp,
} from './interfaces/user-account-creation-mail';

@Injectable()
export class MailService {
  constructor(
    private amqpConnection: AmqpConnection,
    private logService: LogService,
  ) {
    this.logService.setContext(MailService.name);
  }

  async sendMail(message: IUserSendMail[]) {
    try {
      for (const user of message) {
        await this.amqpConnection.publish(
          EXCHANGE.EMAIL,
          ROUTING_KEY.EMAIL_SEND,
          user,
          {
            headers: {
              'x-retries': 0,
            },
          },
        );
        this.logService.debug(`Email sent to ${user?.userEmail}`);
      }
      this.logService.debug(`Email sent successfully`);
    } catch (error) {
      console.error(`Failed to send email to : ${error.message}`);
      throw error;
    }
  }

  async sendMailOtpChangePassword(message: IUserSendMailOtp) {
    try {
      await this.amqpConnection.publish(
        EXCHANGE.EMAIL,
        ROUTING_KEY.OTP_MAIL,
        message,
        {
          headers: {
            'x-retries': 0,
          },
        },
      );
      this.logService.debug(`Email sent to ${message?.userEmail}`);
    } catch (error) {
      console.error(`Failed to send email to : ${error.message}`);
      throw error;
    }
  }
}
