/* eslint-disable */
import { CacheModule, Module } from '@nestjs/common';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { SfService } from '@gowebknot/palette-salesforce-service';
@Module({
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
  imports: [SfService],
})
export class OpportunityModule {}
