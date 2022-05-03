import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import {
  // CachingService,
  SfModule,
} from '@gowebknot/palette-salesforce-service';
@Module({
  imports: [SfModule.forRoot()],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
