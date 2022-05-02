import { Module } from '@nestjs/common';
import { AdvisorController } from './advisor.controller';
import { AdvisorService } from './advisor.service';
import {
  // CachingService,
  SfModule,
} from '@gowebknot/palette-salesforce-service';
@Module({
  imports: [SfModule.forRoot()],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
