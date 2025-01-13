import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { LogService } from 'src/log/log.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class TasksService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private logService: LogService,
    private userService: UsersService,
  ) {
    this.logService.setContext(TasksService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  // @Cron(CronExpression.EVERY_5_SECONDS, {
  //   timeZone: 'Asia/Ho_Chi_Minh',
  // })
  handleTaskStatusUsersAccount() {
    this.logService.log('Start update status account users in system');
    this.userService.updateStatusAccountUsersInSystem();
  }
}
