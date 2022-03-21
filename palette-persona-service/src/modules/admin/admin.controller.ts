import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  UsePipes,
  ValidationPipe,
  Body,
  Post,
  UseInterceptors,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { hasRoles } from '@wrapper/decorators';
import { Role } from '@wrapper/types';
import { CachingService } from '@src/util/caching/caching.service';
import { JwtAuthGuard, RolesGuard } from '@wrapper/guards';

import { ValidatePayloadExistsPipe } from './dtos/payload-not-emptypipe.dto';
import { AcceptRecommendationDto } from './dtos/accept-recommendation.dto';
import { DeclineRecommendationDto } from './dtos/decline-recommendation.dto';
import { EventStatusDto } from './dtos/event-status.dto';
import { UpdateSfAdminDto } from './dtos/update-sfadmin.dto';
import { RecommendationsDataDto } from './dtos/recommend-event.dto';

import { BasicDataResponseDto, BasicResponse } from './types/login-interface';
import {
  AdminBEResponse,
  AdminUpdateBEResponse,
  InstituteDetailsResponse,
  ApprovalTodoResponse,
  AdminUpdateBEResponseDto,
  ApprovalsTodoResponseDto,
} from './types/admin-interface';

import { AdminActivitiesService } from './services/admin-activities.service';
import { AdminService } from './admin.service';
import { Errors } from '@src/constants';

@Controller({
  path: 'admin',
  version: '1',
})
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminActivitiesService: AdminActivitiesService,
    private cachingService: CachingService,
  ) {}

  /**
   * Returns the profile of the admin.
   * @returns {BasicDataResponseDto}
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({ type: AdminBEResponse })
  async getAdmin(@Request() req): Promise<AdminBEResponse> {
    return await this.adminService.getAdmin(req.user.id);
  }

  /** updates admin profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the admin profile data
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Updates admin profile details',
    type: AdminUpdateBEResponseDto,
  })
  @UsePipes(ValidationPipe, ValidatePayloadExistsPipe)
  update(
    @Request() req,
    @Body() updateSfAdminDto: UpdateSfAdminDto,
  ): Promise<AdminUpdateBEResponse> {
    return this.adminService.update(req.user.id, updateSfAdminDto);
  }

  // Event Recommendation Section

  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/event/recommendations')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Updates admin profile details',
    type: RecommendationsDataDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @ApiOkResponse({ type:  })
  async getRecommendedEvents(@Request() req) {
    return await this.adminActivitiesService.getRecommendedEvents(req.user.id);
  }

  /**
   * function to accept a recommended event -> when a admin accepts a recommendation
   *@param acceptRecommendationDto contains event id
   * return status code and errors
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/event/recommendation/accept/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Accepts a recommendation for admin',
    type: BasicDataResponseDto,
  })
  async acceptRecommendation(
    @Body() acceptRecommendationDto: AcceptRecommendationDto,
    @Request() req,
  ) {
    return await this.adminActivitiesService.acceptRecommendation(
      req.user.id,
      acceptRecommendationDto,
    );
  }

  /**
   * function to delete a recommended event -> when a admin declines a recommendation
   *@param recommendationId contains recommendation id
   * return status code and errors
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/event/recommendation/reject/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Rejects a recommendation for admin',
    type: BasicDataResponseDto,
  })
  async declineRecommendation(
    @Body() declineRecommendationDto: DeclineRecommendationDto,
  ): Promise<BasicResponse> {
    return await this.adminActivitiesService.declineRecommendation(
      declineRecommendationDto,
    );
  }
  //-------------------------------------------------------------------------------------//

  /** gets all the students, mentors and guardians inside the admin institute
   *  @param {Request} req request / access token
   * @returns {Object} returns students, mentors, admins and guardians
   */
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('institute')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets all institute data for admin',
    type: BasicDataResponseDto,
  })
  async adminScreenDetails(
    @Request() req,
  ): Promise<InstituteDetailsResponse | unknown> {
    const cacheKey = `${req.user.id}-adminDetails`;

    const cachedResponse = await this.cachingService.getKey(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await this.adminService.getAdminInstituteDetails(
      req.user.id,
    );
    await this.cachingService.setKey(cacheKey, response);
    return response;
  }

  /** gets In Review opportunity detail
   *  @param {id} string opportunity id
   *  @returns {Object} status code and message and opportunity information
   */
  @hasRoles(Role.Administrator, Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('approvals/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets the details of an opportunity in review',
    type: BasicDataResponseDto,
  })
  async getOpportunityDetail(@Param('id') id): Promise<any> {
    return await this.adminService.getOpportunityDetail(id);
  }

  /** approves the opportunity
   *  @param {id} string opportunity id
   */
  @hasRoles(Role.Administrator, Role.Advisor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('status')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Approves an opportunity',
  })
  async changeOpportunityStatus(
    @Request() req,
    @Body('eventStatusDto') eventStatusDto: EventStatusDto,
  ): Promise<BasicResponse> {
    const { eventId, status, type } = eventStatusDto;

    if (status === 'Accept') {
      return await this.adminService.approvalStatus(eventId, type, req.user.id);
    }
    if (status === 'Reject') {
      return await this.adminService.rejectOpportunity(
        eventId,
        type,
        req.user.id,
      );
    }
    throw new BadRequestException(Errors.INVALID_OPPORTUNITY_STATUS);
  }

  // Global Todo Api's

  // Get all In-Review Todo's
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approvals')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets all in review todos',
  })
  async getTodos(): Promise<ApprovalsTodoResponseDto> {
    return await this.adminService.getTodos();
  }

  // Get In-Review Todo's detail
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approvals/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets the details of a todo in review',
    type: BasicDataResponseDto,
  })
  async getTodoDetail(@Param('id') id): Promise<ApprovalTodoResponse> {
    return await this.adminService.getTodoDetail(id);
  }

  // Approve Todo
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/approve/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Approves a todo',
    type: BasicDataResponseDto,
  })
  async approveTodo(@Param('id') id): Promise<BasicResponse> {
    return await this.adminService.approveTodo(id);
  }

  // Reject Todo
  @hasRoles(Role.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/reject/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Rejects a todo',
    type: BasicDataResponseDto,
  })
  async rejectTodo(@Param('id') id): Promise<BasicResponse> {
    return await this.adminService.rejectTodo(id);
  }
}
