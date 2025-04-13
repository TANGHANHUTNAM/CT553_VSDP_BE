import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationsService {
  private events = new Map<number, Subject<any>>();
  registerClient(userId: number): Subject<any> {
    if (!this.events.has(userId)) {
      this.events.set(userId, new Subject<any>());
    }
    return this.events.get(userId);
  }

  sendNotification(userId: number, message: any) {
    const subject = this.events.get(userId);
    if (subject) {
      subject.next(message);
    }
  }

  unregisterClient(userId: number) {
    this.events.delete(userId);
  }
  create(createNotificationDto: CreateNotificationDto) {
    return 'This action adds a new notification';
  }

  findAll() {
    return `This action returns all notifications`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
