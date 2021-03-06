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
  Post,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
} from '@gowebknot/palette-wrapper';
// import { CachingService } from '@gowebknot/palette-salesforce-service';
import { AdvisorService } from './advisor.service';
import { UpdateSfAdvisorDto } from './dto/advisor-update-profile.dto';
import { QueryRequired } from '@src/decorators';

@Controller({
  path: 'advisor',
})
export class AdvisorController {
  constructor(
    private advisorService: AdvisorService, // private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getAdmin(
    @Request() req, 
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ) {
    // // Cache the user profile as it's accessed multiple
    // // times throughout the application
    // const cacheKey = `advisor_${req.user.id}`;
    // const cachedAdvisor = await this.cachingService.get(cacheKey);
    // if (cachedAdvisor) {
    //   return cachedAdvisor;
    // }

    const advisor = await this.advisorService.getAdvisor(
      req.user.id,
      instituteId,
      programId,
    );
    // await this.cachingService.set(cacheKey, advisor);
    return advisor;
  }

  /** updates advisor profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the advisor profile data
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  async update(
    @Request() req,
    @Body() updateSfAdvisorDto: UpdateSfAdvisorDto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return this.advisorService.update(
      req.user.id,
      updateSfAdvisorDto,
      instituteId,
      programId,
    );
  }

  /**
   * Function to get the details of the advisor by ID
   * @param id id of the advisor
   * object Array of advisor details
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Administrator,
    Role.Advisor,
    Role.Observer,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('details/:id')
  async getAdvisorDetails(
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ) {
    return await this.advisorService.getAdvisor(id, instituteId, programId);
  }

  // Guardian Opportunity Approvals
  @hasRoles(Role.Advisor, Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('opportunity/approvals')
  async getOpportunityApprovals(
    @Request() req,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    console.log(req.user);

    return await this.advisorService.getOpportunityApprovals(
      req.user.id,
      req.user.recordTypeName,
      instituteId,
      programId,
    );
  }

  @hasRoles(Role.Advisor, Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('opportunity/approvals/:id')
  async getOpportunityDetail(
    @Request() req,
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    return await this.advisorService.getOpportunitydetail(
      id,
      instituteId,
      programId,
    );
  }

  @hasRoles(Role.Advisor, Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('opportunity/approvals/:id')
  async opportunityApprovals(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    console.log(status, instituteId,programId);
    if (status == 'Accept') {
      return await this.advisorService.acceptOrRejectOpportunity(
        id,
        'In Review',
        req.user.id,
        instituteId,
        programId,
      );
    } else {
      return await this.advisorService.acceptOrRejectOpportunity(
        id,
        'Rejected',
        req.user.id,
        instituteId,
        programId,
      );
    }
  }
}
