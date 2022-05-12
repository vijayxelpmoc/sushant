import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PayloadService } from './payload';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [NotificationsService, PayloadService],
  exports: [NotificationsService, PayloadService]
})
export class NotificationsModule {}
