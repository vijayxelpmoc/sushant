import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
  UseInterceptors,
  Query,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
} from '@gowebknot/palette-wrapper';
import { CachingService } from '@gowebknot/palette-salesforce-service';
import { AdvisorService } from './advisor.service';

@Controller({
  path: 'advisor',
})
export class AdvisorController {
  constructor(
    private advisorService: AdvisorService,
    private cachingService: CachingService,
  ) {}
  
  @hasRoles(Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile?')
  async getAdmin(
    @Request() req,
    @Query('instituteId') instituteId: string,  
  ) {
    // Cache the user profile as it's accessed multiple
    // times throughout the application
    const cacheKey = `advisor_${req.user.id}`;
    const cachedAdvisor = await this.cachingService.get(cacheKey);
    if (cachedAdvisor) {
      return cachedAdvisor;
    }
    const advisor = await this.advisorService.getAdvisor(req.user.id, instituteId);
    await this.cachingService.set(cacheKey, advisor);
    return advisor;
  }
}

