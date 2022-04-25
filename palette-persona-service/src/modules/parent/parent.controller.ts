import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Query,
} from '@nestjs/common';

import {
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
  Role,
} from '@gowebknot/palette-wrapper';
import { CachingService } from '@gowebknot/palette-salesforce-service';
import { ParentService } from './parent.service';

@Controller({
  path: 'parent',
})
export class ParentController {
  constructor(
    private parentService: ParentService,
    private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Parent)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile?')
  async getAdmin(@Request() req, @Query('instituteId') instituteId: string) {
    // Cache the user profile as it's accessed multiple
    // times throughout the application
    const cacheKey = `parent_${req.user.id}`;
    const cachedParent = await this.cachingService.get(cacheKey);
    if (cachedParent) {
      return cachedParent;
    }
    const parent = await this.parentService.getParent(req.user.id, instituteId);
    await this.cachingService.set(cacheKey, parent);
    return parent;
  }

  // @hasRoles(Role.Parent)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('profile/update')
  // async updateParentProfile(
  //   @Request() req,
  //   // @Body() updateSfParentDto: UpdateSfParentDto,
  // ) {
  //   return await this.parentService.updateParentProfile(
  //     req.user.id,
  //     updateSfParentDto,
  //   );
  // }

  // @hasRoles(Role.Parent)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get('dependents/institutes')
  // async getAvailableInstitutes(@Request() req) {
  //   return await this.parentService.getDependentInstitutes(req.user.id);
  // }
}
