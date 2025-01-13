import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  providers: [TasksService],
  exports: [TasksService],
  imports: [UsersModule],
})
export class TasksModule {}
