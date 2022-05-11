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
import { AdminService } from './admin.service';
import { UpdateSfAdminDto } from './dto/admin-update-profile.dto';
import { ApprovalTodoResponse } from './types/admin-interface';
import { EventStatusDto } from '../advisor/dto/advisor-update-profile.dto';

@Controller({
  path: 'admin',
})
export class AdminController {
  constructor(
    private adminService: AdminService, // private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getAdmin(@Request() req, @Query('instituteId') instituteId: string) {
    console.log(req.user);
    
    // // Cache the user profile as it's accessed multiple
    // // times throughout the application
    // const cacheKey = `admin_${req.user.id}`;
    // const cachedAdmin = await this.cachingService.get(cacheKey);
    // if (cachedAdmin) {
    //   return cachedAdmin;
    // }
    const admin = await this.adminService.getAdmin(req.user.id, instituteId);
    // await this.cachingService.set(cacheKey, admin);
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
    return await this.adminService.update(
      req.user.id,
      updateSfAdminDto,
      instituteId,
    );
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

  /** gets In Review opportunity detail
   *  @param {id} string opportunity id
   *  @returns {Object} status code and message and opportunity information
   */
  @hasRoles(Role.Administrator, Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('approvals/:id') // 1 error
  async getOpportunitydetail(
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    // console.log(req.user);
    
    return await this.adminService.getOpportunitydetail(id, instituteId);
  }

  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approvals')
  async getTodos(@Query('instituteId') instituteId: string): Promise<any> {
    return await this.adminService.getTodos(instituteId);
  }

  /** approves the opportunity
   *  @param {id} string opportunity id
   */
  @hasRoles(Role.Administrator, Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('status') // App5
  async ChangeOpportunityStatus(
    @Request() req,
    @Body('eventStatusDto') eventStatusDto: EventStatusDto,
    @Body('instituteId') instituteId: string,
  ): Promise<any> {
    console.log(`eventStatusDto`, eventStatusDto);
    const { eventId, status, type } = eventStatusDto;

    if (status === 'Accept') {
      return await this.adminService.approvalStatus(
        eventId,
        type,
        req.user.id,
        instituteId,
      );
    }
    if (status === 'Reject') {
      return await this.adminService.rejectOpportunity(
        eventId,
        type,
        req.user.id,
        instituteId,
      );
    }
    return { statusCode: 400, message: 'status must be Accept/Reject' };
  }

  // Get In-Review Todo's detail
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approvals/:id') // App3,4
  async getTodoDetail(
    @Param('id') id,
    @Query('instituteId') instituteId: string,
  ): Promise<ApprovalTodoResponse> {
    return await this.adminService.getTodoDetail(id, instituteId);
  }

  // Approve Todo
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approve/:id') // App
  async approveTodo(
    @Param('id') id,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.adminService.approveTodo(id, instituteId);
  }

  // Reject Todo
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/reject/:id') //App
  async rejectTodo(
    @Param('id') id,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.adminService.rejectTodo(id, instituteId);
  }
}
