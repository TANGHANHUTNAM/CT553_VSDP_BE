import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LogService extends ConsoleLogger {
  customLog() {
    this.log('Đây là log custom');
  }
}
