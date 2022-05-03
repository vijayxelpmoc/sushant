/* eslint-disable */
import { CacheModule, Module } from '@nestjs/common';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { SfModule } from '@gowebknot/palette-salesforce-service';
import { OpportunityServiceNew } from './opportunity_new.service';
// import {OpportunityServiceNew}
@Module({
  controllers: [OpportunityController],
  providers: [OpportunityService, OpportunityServiceNew],
  exports: [OpportunityService, OpportunityServiceNew],
  imports: [SfModule],
})
export class OpportunityModule {}
