import { Module } from '@nestjs/common';
import { FormAssginmentResponseService } from './form-assginment-response.service';
import { FormAssginmentResponseController } from './form-assginment-response.controller';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [FormAssginmentResponseController],
  providers: [FormAssginmentResponseService],
  exports: [FormAssginmentResponseService],
  imports: [NotificationsModule],
})
export class FormAssginmentResponseModule {}
