import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  // private readonly logger = new Logger('aaaa');

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // handleCron() {
  //   this.logger.debug('Called when the current second is 10');
  // }
}
