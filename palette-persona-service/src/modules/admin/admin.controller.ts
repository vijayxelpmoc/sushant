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
import { AdminService } from './admin.service';

@Controller({
  path: 'admin',
})
export class AdminController {
  constructor(
    private adminService: AdminService,
    private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getAdmin(@Request() req, @Query('instituteId') instituteId: string) {
    // Cache the user profile as it's accessed multiple
    // times throughout the application
    const cacheKey = `admin_${req.user.id}`;
    const cachedAdmin = await this.cachingService.get(cacheKey);
    if (cachedAdmin) {
      return cachedAdmin;
    }
    const admin = await this.adminService.getAdmin(req.user.id, instituteId);
    await this.cachingService.set(cacheKey, admin);
    return admin;
  }
}
