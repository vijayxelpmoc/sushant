import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Get,
  Param,
} from '@nestjs/common';

import { OpportunityService } from './opportunity.service';

@Controller({ path: 'opportunities' })
export class OpportunitiesController {
  constructor(private readonly oppService: OpportunityService) {}

  @Get()
  async getOpportunities(@Request() req) {}

  @Get(':id')
  async getOpportunity(@Request() req, @Param('id') id: string) {}
}
