import { Module } from '@nestjs/common';
import { ObserverService } from './observer.service';
import { ObserverController } from './observer.controller';
import {
  // CachingService,
  SfModule,
} from '@gowebknot/palette-salesforce-service';
@Module({
  imports: [SfModule.forRoot()],
  providers: [ObserverService],
  controllers: [ObserverController],
  exports: [ObserverService],
})
export class ObserverModule {}
