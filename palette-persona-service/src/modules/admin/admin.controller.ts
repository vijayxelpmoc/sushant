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
import { UpdateSfAdminDto } from './dto/admin-update-profile.dto';


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
  async getAdmin(
    @Request() req, 
    @Query('instituteId') instituteId: string
  ) {
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

  /** updates admin profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the admin profile data
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  async update(
    @Request() req,
    @Body() updateSfAdminDto: UpdateSfAdminDto,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.adminService.update(req.user.id, updateSfAdminDto, instituteId);
  }

  /**
   * Function to get the details of the administrator by ID
   * @param id id of the administrator
   * object Array of administrator details
   */
  @hasRoles(
    Role.Parent,
    Role.Administrator,
    Role.Advisor,
    Role.Observer,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('details/:id')
  async getAdminDetails(
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
  ) {
    return await this.adminService.getAdmin(id, instituteId);
  }
}
