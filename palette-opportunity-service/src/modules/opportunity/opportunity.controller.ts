/* eslint-disable */
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
import {
  AllCommentsDto,
  CreateDraftOpportunityDto,
  DeleteOpportunityDto,
  DraftInfoDto,
  SetDraftOpportunityStatusDto,
} from './dtos/opportunities.dto';

import { OpportunitiesInfoDto } from './dtos/opportunities.dto';
import { OpportunityService } from './opportunity.service';
import { BasicResponse } from './types/login-interface';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Role,
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
} from '@gowebknot/palette-wrapper';
import { CommentsDto } from './dtos/create-comments.dto';
import { InstituteDataResponse } from './types/create-opportunity-interface';

@Controller({
  path: 'opportunity',
})
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create/draft')
  @ApiBearerAuth()
  @ApiBody({ type: CreateDraftOpportunityDto })
  @ApiResponse({
    status: 201,
    description: 'Created draft opportunity',
  })
  async createDraftOpportunity(
    @Request() req,
    @Body('opportunitiesInfoDto') opportunitiesInfoDto: DraftInfoDto,
    @Body('assignees') assignees: string[],
    @Body('InstituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.createDraftOpportunity(
      opportunitiesInfoDto,
      req.user.id,
      assignees,
      instituteId,
      req.user.RecordTypeName,
    );
  }

  /*
      add opportunity to considerations
      '/opportunities/add/considerations'
    */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/add/considerations')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'add opportunity to considerations',
  })
  async considerOpportunities(@Request() req, @Body('id') id: string) {
    return await this.opportunityService.addToConsiderations(req.user.id, id);
  }

  // updates the status of a draft opportunity to live (Available / In Review)
  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('publish')
  @ApiBearerAuth()
  @ApiBody({ type: SetDraftOpportunityStatusDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiResponse({
    status: 201,
    description: 'Published draft opportunity',
  })
  async setDraftOpportunityStatus(
    @Request() req,
    @Body('opportunityId') opportunityId: string,
  ) {
    return await this.opportunityService.setDraftOpportunityStatus(
      opportunityId,
      req.user.id,
    );
  }

  /* Delete API for editing a student opportunity */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('delete') // Soft delete
  @ApiBearerAuth()
  @ApiBody({ type: DeleteOpportunityDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiResponse({
    status: 201,
    description: 'Deleted the opportunity',
  })
  async deleteOpportunities(
    @Request() req,
    @Body('opportunityIds') opportunityIds: string[],
    @Body('message') message: string,
  ) {
    return await this.opportunityService.deleteOpportunity(
      req.user.id,
      opportunityIds,
      message,
      req.user.RecordTypeName,
    );
  }

  /** gets comments based on opportunity
   *  @param {id} string opportunity id
   *  @returns {Object} status code and message and opportunity comments list
   */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('comments/:id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'opportunity id',
    schema: { type: 'string' },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiResponse({
    status: 201,
    description: 'Fetched all the comments of the opportunity',
  })
  async getComments(@Request() req, @Param('id') id): Promise<AllCommentsDto> {
    return await this.opportunityService.getOpportunityComments(
      req.user.id,
      req.user.RecordTypeName,
      id,
    );
  }

  /** creates comment on opportunity
   *  @param {id} string opportunity id and commentsDto
   *  @Returns status code and message
   */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('comment')
  @ApiBearerAuth()
  @ApiBody({ type: CommentsDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiResponse({
    status: 201,
    description: 'Added the comment to opportunity',
  })
  async createComment(
    @Request() req,
    @Body('commentsDto') commentsDto: CommentsDto,
  ): Promise<BasicResponse> {
    return await this.opportunityService.createOpportunityComment(
      req.user.id,
      commentsDto,
    );
  }
  /*
      add opportunity to todo
    */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/add/todo')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'add opportunity to Todo',
  })
  async todoOpportunities(@Request() req, @Body('id') id: string) {
    return await this.opportunityService.addToTodo(req.user.id, id);
  }

  /*
      bulk add opportunity to considerations
      '/opportunities/bulk/add/considerations'
      Listed_by__c
      assigneeId : req.user.id
      a list of opportunity Ids
      the logged in user
      assigneeId
     */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/bulk/add/considerations')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Bulk add opportunities to considerations',
  })
  async bulkAddOpportunitiesToConsiderations(
    @Request() req,
    @Body('opportunities') opportunities: string[],
  ) {
    return await this.opportunityService.bulkAddOpportunitiesToConsiderations(
      req.user.id,

      opportunities,
    );
  }

  /*
      bulk add opportunity to todo
      '/opportunities/bulk/add/todo'
     */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/bulk/add/todos')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'add opportunity to todo',
  })
  async bulkAddOpportunitiesToTodo(
    @Request() req,
    @Body('opportunities') opportunities: string[],
  ) {
    return await this.opportunityService.bulkAddOpportunitiesToConsiderations(
      req.user.id,
      opportunities,
    );
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get opportunities created by authenticated user',
  })
  async getOpportunitiesCreatedByAuthenticatedUser(@Request() req) {
    return await this.opportunityService.getOpportunitiesCreatedByAuthenticatedUser(
      req.user.id,
    );
  }

  /*
      Get opportunities in the authenticated user's considerations list
    */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/myConsiderations')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Get opportunities in authenticated user's consideration list",
  })
  async getOpportunitiesFromConsiderations(@Request() req) {
    return await this.opportunityService.getOpportunitiesFromConsiderations(
      req.user.id,
    );
  }

  /** creates opportunity
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/create')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Creates an opportunity',
    type: OpportunitiesInfoDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createOpportunity(
    @Request() req,
    @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('assignees') assignees: string[],
    @Body('InstituteId') InstituteId: string,
  ) {
    return await this.opportunityService.createOpportunity(
      opportunitiesInfoDto,
      req.user.id,
      assignees,
      InstituteId,
      req.user.RecordTypeName,
    );
  }

  /** updates an opportunity for all user
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {opportunityId} string the id of the record we updating
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/update/:id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'opportunity id',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 200,
    description: 'Updates an opportunity of the passed ID',
    type: OpportunitiesInfoDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body('updateData') opportunitiesInfoDto: OpportunitiesInfoDto,
  ) {
    return this.opportunityService.updateOpportunity(
      opportunitiesInfoDto,
      id,
      req.user.id,
    );
  }

  /* PATCH API for editing to allow bulk hiding/unhiding a particular opportunities */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/bulk/visibility/update')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      properties: {
        opportunityIds: { type: 'array', items: { type: 'string' } },
        hidingStatus: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk Updates the visibility status of opportunities',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async hideAndUnhideBulkOpportunities(
    @Request() req,
    @Body('hidingStatus') hidingStatus: string,
    @Body('opportunityIds') opportunityIds: string[],
  ) {
    return await this.opportunityService.changeHidingStatus(
      req.user.id,
      opportunityIds,
      hidingStatus,
    );
  }

  /* PATCH API for editing to allow  hiding/unhiding particular opportunities */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/visibility/update/:id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'opportunity id',
    schema: { type: 'string' },
  })
  @ApiBody({
    schema: {
      properties: {
        hidingStatus: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk Updates the visibility status of opportunities',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async hideAndUnhideOpportunity(
    @Request() req,
    @Param('id') id: string,
    @Body('hidingStatus') hidingStatus: string,
  ) {
    return await this.opportunityService.changeHidingStatus(
      req.user.id,
      [id],
      hidingStatus,
    );
  }

  /** gets  all opportunity detail
   *  @returns {Object} status code and message and opportunity information
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetched all opportunity',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Get('')
  async getOpportunityUserId(@Request() req) {
    return await this.opportunityService.getOpportunityWithUserId(req.user.id);
  }

  /** gets opportunity detail by id
   *  @param {Id} string Opportunity id
   *  @returns {Object} status code and message and opportunity information
   */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    status: 200,
    description: 'opportunity by id',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Opportunity id',
    schema: { type: 'string' },
  })
  @Get('/details/:id')
  async getOpportunityById(@Param() params) {
    return await this.opportunityService.getOpportunityById(params.id);
  }

  /** gets recipients
   *  @returns {Object} status code and message and recipient list
   */
  @hasRoles(
    Role.Student,
    // Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetched all Recipients',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Get('recipients')
  async getRecipients(@Request() req): Promise<InstituteDataResponse> {
    return await this.opportunityService.getOpportunityRecipients(
      req.user.id,
      req.user.RecordTypeName,
    );
  }
}
