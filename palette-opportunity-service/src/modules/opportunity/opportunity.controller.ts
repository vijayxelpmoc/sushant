import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  AllCommentsDto,
  CreateDraftOpportunityDto,
  DeleteOpportunityDto,
  DraftInfoDto,
  SetDraftOpportunityStatusDto,
} from './dtos/opportunities.dto';

import { OpportunitiesInfoDto, OpportunityTodoDto } from './dtos/opportunities.dto';
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
import { draftInfoDto } from './dto/opportunities.dto';

@Controller({
  path: 'opportunity',
})
export class OpportunityController {
  constructor(
    private readonly opportunityService: OpportunityService
  ) {}

  // @hasRoles(
  //   Role.Parent,
  //   Role.Advisor,
  //   Role.Faculty,
  //   Role.Administrator,
  //   Role.Observer,
  // )  
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('others')
  // async createOpportunityOtherRole(
  //   @Request() req,
  //   @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('instituteId') instituteId: string,
  // ): Promise<BasicResponse> {
  //   return await this.opportunityService.CreateOpportunityOtherRoles(
  //     req.user.id,
  //     req.user.recordTypeName,
  //     opportunitiesInfoDto,
  //     instituteId,
  //   );
  // }

  // /** gets all self created opportunities
  // *  @param {userId} string user id
  // * @returns {Object} status code and message and opportunity information
  // */
  // @hasRoles(
  //   Role.Student,
  //   Role.Parent,
  //   Role.Advisor,
  //   Role.Faculty,
  //   Role.Administrator,
  // )  
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get()
  // async getLinkedOpportunites(
  //   @Request() req,
  //   @Query('instituteId') instituteId: string,  
  // ): Promise<any> {    
  //   return await this.opportunityService.getLinkedOpportunities(
  //     req.user.id,
  //     instituteId,
  //   );
  // }

  // /** updates an opportunity for all user
  // *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  // *  @param {opportunityId} string the id of the record we updating
  // * @returns {Object} status code and message
  // */
  // @hasRoles(
  //   Role.Student,
  //   Role.Parent,
  //   Role.Advisor,
  //   Role.Faculty,
  //   Role.Administrator,
  // )  
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('/update')
  // async update(
  //   @Request() req,
  //   @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('opportunityId') opportunityId: string,
  //   @Body('instituteId') instituteId: string,
  // ) {
  //   return await this.opportunityService.updateOpportunity(
  //     opportunitiesInfoDto,
  //     opportunityId,
  //     req.user.id,
  //     instituteId,
  //   );
  // }

  // /** creates opportunity for multiple students
  // *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  // *  @param {userId} string user id
  // * @returns {Object} status code and message
  // */
  // @hasRoles(
  //   Role.Parent,
  //   Role.Advisor,
  //   Role.Faculty,
  //   Role.Administrator,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('multi')
  // async CreateOpportunityForMultipleStudents(
  //   @Request() req,
  //   @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('instituteId') instituteId: string,
  // ): Promise<BasicResponse> {
  //   return await this.opportunityService.CreateOpportunityForMultipleStudents(
  //     req.user.id,
  //     opportunitiesInfoDto,
  //     instituteId,
  //   );
  // }

  // /** adds opportunites in bulk to to do for students
  // *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  // *  @param {userId} string user id
  // * @returns {Object} status code and message
  // */
  // @hasRoles(Role.Student)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('bulk/edit/student')
  // async bulkEditOpportunitiesStudent(
  //   @Request() req,
  //   @Body('opportunities') opportunities: string[],
  //   @Body('instituteId') instituteId: string,
  // ): Promise<BasicResponse> {
  //   return await this.opportunityService.bulkEditOpportunitiesStudent(
  //     req.user.id,
  //     opportunities,
  //     instituteId,
  //   );
  // }

  // // LEFT
  // /** adds opportunites in bulk to to do for otherss
  // *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  // *  @param {userId} string user id
  // * @returns {Object} status code and message
  // */
  //  @hasRoles(
  //   Role.Parent,
  //   Role.Advisor,
  //   Role.Faculty,
  //   Role.Administrator,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('bulk/edit/others')
  // async bulkEditOpportunitiesOthers(
  //   @Request() req,
  //   @Body() opportunitiesInfoDto: OpportunitiesInfoDto[],
  //   @Body('assigneeId') assigneeId: string,
  //   @Body('instituteId') instituteId: string,
  // ) {
  //   return await this.opportunityService.bulkEditOpportunitiesOthers(
  //     req.user.id,
  //     assigneeId,
  //     opportunitiesInfoDto,
  //     instituteId,
  //   );
  // }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> V2 APIS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  /** gets user global and discrete opportunities
   *  @param {userId} string user id
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
  @Get('user')
  async getUserOpportunities(
    @Request() req,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.opportunityService.getSelfOpportunities(req.user.id, instituteId);
  }

  /** adds opportunity to consideration
   *  @param {Id} string opportunity id
   *  @returns {Object} status code and message
   */
   @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('add/considerations/:opportunityId')
  async ConsiderOpportunities(
    @Request() req,
    @Param('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.addtoConsiderations(
      req.user.id,
      opportunityId,
      instituteId,
    );
  }

  /** adds opportunity to todo
   *  @param {Id} string opportunity id
   *  @returns {Object} status code and message 0014C00000eEK6sQAG
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('single/add/todo/:opportunityId')
  async todoOpportunities(
    @Request() req,
    @Param('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.addtoTodo(req.user.id, opportunityId, instituteId);
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
  @Post('add')
  async CreateOpportunity(
    @Request() req,
    @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {    
    return await this.opportunityService.CreateOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunitiesInfoDto,
      instituteId,
    );
  }

  /* Patch API for editing a discrete student opportunity */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/edit/discrete')
  async editDiscreteOpportunites(
    @Request() req,
    @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('opportunityId') opportunityId: string,
    @Body('recipientIds') recipientIds: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.EditDiscreteOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      opportunitiesInfoDto,
      recipientIds,
      instituteId,
    );
  }

  /* PATCH API for editing to allow bulk hiding/unhiding opportunities */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/visibility')
  async hideAndUnhideBulkOpportunites(
    @Request() req,
    @Body('hidingStatus') hidingStatus: string,
    @Body('opportunityIds') opportunityIds: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.changeHidingStatus(
      req.user.id,
      opportunityIds,
      hidingStatus,
      instituteId
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
  @Patch('/delete') // Soft delete
  async deleteOpportunites(
    @Request() req,
    @Body('opportunityIds') opportunityIds: string[],
    @Body('message') message: string,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.deleteOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityIds,
      message,
      instituteId
    );
  }

  /* API for suggesting edit of a Global Student Opportunity */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/edit/global')
  async suggestingEditGlobalOpportunity(
    @Request() req,
    @Body() opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.opportunityService.EditGlobalOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      opportunitiesInfoDto,
      instituteId
    );
  }

  /* API for suggesting edit of a Global Student Opportunity */
  @hasRoles(
    Role.Student,
    Role.Observer,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/edit/draft')
  async suggestingEditDraftOpportunity(
    @Request() req,
    @Body() opportunitiesInfoDto: draftInfoDto,
    @Body('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.opportunityService.EditDraftOpportunity(
      req.user.id,
      opportunityId,
      opportunitiesInfoDto,
      instituteId,
    );
  }

  /** creates draft opportunity
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('draft')
  async CreateDraftOpportunity(
    @Request() req,
    @Body() opportunitiesInfoDto: draftInfoDto,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.CreateDraftOpportunity(
      opportunitiesInfoDto,
      req.user.id,
      req.user.recordTypeName,
      instituteId
    );
  }

  // Create an API to change the status of a draft opportunity to live (Available / In Review)
  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('draft/live')
  async setDraftOpportunityStatus(
    @Request() req,
    @Body('opportunityId') opportunityId: string,
    @Body() opportunitiesInfoDto: draftInfoDto,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.SetDraftOpportunityStatus(
      opportunityId,
      opportunitiesInfoDto,
      req.user.id,
      req.user.recordTypeName,
      instituteId
    );
  }

  /** gets opportunity detail
   *  @param {userId} string user id
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
  @Get('detail/:id')
  async getopportunity(
    @Request() req,
    @Param('id') id,
    @Query('instituteId') instituteId: string, 
  ): Promise<any> {
    return await this.opportunityService.getOpportunityDetail(id, instituteId);
  }

  /** gets modification detail
   *  @param {userId} string user id
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
  @Get('modification/:modificationId')
  async getModification(
    @Request() req,
    @Param('modificationId') modificationId,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.opportunityService.getModificationDetail(
      req.user.id,
      modificationId,
      instituteId
    );
  }

  /** Removal Cancel
   *  @param {userId} string user id
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
  @Post('removal/cancel/:opportunityId')
  async removalCancel(
    @Request() req, 
    @Param('opportunityId') opportunityId: string, 
    @Body('instituteId') instituteId: string
  ) {
    return await this.opportunityService.removalCancel(
      req.user.id,
      opportunityId,
      instituteId
    );
  }

  /** Modification Cancel
   *  @param {userId} string user id
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
  @Post('modification/cancel/:opportunityId')
  async modificationCancel(
    @Request() req,
    @Param('opportunityId') opportunityId,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.modificationCancel(
      req.user.id,
      opportunityId,
      instituteId
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
  async getcomments(
    @Request() req, 
    @Param('id') id: string, 
    @Query('instituteId') instituteId: string
  ): Promise<any> {
    return await this.opportunityService.getOpportunityComments(
      req.user.id,
      req.user.recordTypeName,
      id,
      instituteId
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
  async createComment(
    @Request() req,
    @Body() commentsDto: CommentsDto,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.createOpportunityComment(
      req.user.id,
      req.user.recordTypeName,
      commentsDto,
      instituteId,
    );
  }

  /** adds opportunites in bulk to recommendations
   *  @param {opportunities} string[] array of opportunity IDs
   *  @param {userId} string user id
   * @param {assigneeId} string assignee id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk/save')
  async bulkAddOpportunitiesToConsiderations(
    @Request() req,
    @Body('opportunities') opportunities: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.bulkAddOpportunitiesToConsiderations(
      req.user.id,
      opportunities,
      instituteId,
    );
  }

  /** adds opportunites in bulk to to do
   *  @param {opportunities} string[] array of the opportunity Ids
   *  @param {userId} string user id
   * @param {assigneeId} string assignee Id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('add/todo')
  async bulkAddConsiderationsToToDo(
    @Request() req,
    @Body('considerations') considerations: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.bulkAddConsiderationToToDo(
      req.user.id,
      considerations,
      instituteId
    );
  }

  /** adds opportunites in bulk to recommendations in bulk
   *  @param {opportunities} string[] array of the opportunity Ids
   *  @param {userId} string user id
   * @param {assigneeId} string assignee Id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('share')
  async shareConsideration(
    @Request() req,
    @Body('opportunityIds') opportunityIds: string[],
    @Body('assigneesIds') assigneesIds: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.shareConsideration(
      req.user.id,
      opportunityIds,
      assigneesIds,
      instituteId
    );
  }

  /** dismisses bulk recommendations
   *  @param {considerations} string[] array of the opportunity Ids
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Student,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('dismiss')
  async bulkDismissConsideration(
    @Request() req,
    @Body('considerations') considerations: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.bulkDismissConsiderations(
      considerations,
      instituteId
    );
  }

  /** adds opportunites in bulk to to do for otherss
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   * @returns {Object} status code and message
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk/opp/todo')
  async bulkOpportunitiesTodo(
    @Request() req,
    @Body() opportunityTodoDto: OpportunityTodoDto,
    @Body('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.opportunityService.bulkOpportunitiestoTodo(
      req.user.id,
      req.user.recordTypeName,
      opportunityTodoDto,
      instituteId
    );
  }

  /** gets enrolled and interested opportunity users
   *  @param {opportunityId} string opportunity id
   * @returns {Object} status code, message, enrolledUsers & interestedUsers
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('opportunity-users/:opportunityId')
  async getOpportunityUsers(
    @Request() req,
    @Param('opportunityId') opportunityId: string,
    @Query('instituteId') instituteId: string,  
  ): Promise<any> {
    return await this.opportunityService.getOpportunityUsers(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      instituteId
    );
  }
}

// YML DATA
// custom:
//   serverless-offline: 
//     httpsProtocol: "dev-certs"
//     httpPort: 4000
//     lambdaPort: 4002
