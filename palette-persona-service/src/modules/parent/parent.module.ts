import { Module } from '@nestjs/common';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { CachingService, SfModule } from '@gowebknot/palette-salesforce-service';
@Module({
  imports: [SfModule.forRoot(), CachingService],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}
