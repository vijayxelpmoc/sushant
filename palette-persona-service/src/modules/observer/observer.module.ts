import { Module } from '@nestjs/common';
import { ObserverService } from './observer.service';
import { ObserverController } from './observer.controller';

@Module({
  providers: [ObserverService],
  controllers: [ObserverController],
  exports: [ObserverService],
})
export class ObserverModule {}
