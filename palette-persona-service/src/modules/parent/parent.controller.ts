import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Query,
  Param,
} from '@nestjs/common';

import {
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
  Role,
} from '@gowebknot/palette-wrapper';
// import { CachingService } from '@gowebknot/palette-salesforce-service';
import { ParentService } from './parent.service';
import { UpdateSfParentDto } from './dto/parent-update-profile.dto';
import { QueryRequired } from '@src/decorators';

@Controller({
  path: 'parent',
})
export class ParentController {
  constructor(
    private parentService: ParentService,
    // private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Parent)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getParent(@Request() req, @Query('instituteId') instituteId: string, @QueryRequired('programId') programId: string,) {
    // // Cache the user profile as it's accessed multiple
    // // times throughout the application
    // const cacheKey = `parent_${req.user.id}`;
    // const cachedParent = await this.cachingService.get(cacheKey);
    // if (cachedParent) {      
    //   return cachedParent;
    // }
    const parent = await this.parentService.getParent(req.user.id, instituteId, programId);
    // await this.cachingService.set(cacheKey, parent);
    return parent;
  }

  /**
   * Function to get the details of the parent by ID
   * @param id id of the parent
   * object Array of parent details
   */
   @hasRoles(
    Role.Administrator,
    Role.Parent,
    Role.Student,
    Role.Advisor,
    Role.Observer,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('details/:id')
  getParentDetails(
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ) {
    return this.parentService.getParent(id, instituteId, programId);
  }

  /** updates parent profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the advisor profile data
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Parent)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  update(
    @Request() req, 
    @Body() updateSfParentDto: UpdateSfParentDto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return this.parentService.update(
      req.user.id, 
      updateSfParentDto,
      instituteId,
      programId,
    );
  }
}
