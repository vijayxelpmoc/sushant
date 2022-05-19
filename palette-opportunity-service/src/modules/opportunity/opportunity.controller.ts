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
  WishListDto,
} from './dtos/opportunities.dto';

import { OpportunitiesInfoDto, OpportunityTodoDto } from './dtos/opportunities.dto';
import { OpportunityService } from './opportunity.service';
import { BasicResponse } from './types/login-interface';
import {
  Role,
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
} from '@gowebknot/palette-wrapper';
import { CommentsDto } from './dtos/create-comments.dto';
import { InstituteDataResponse } from './types/create-opportunity-interface';
import { draftInfoDto } from './dto/opportunities.dto';
import { QueryRequired } from '@src/decorators'; 

@Controller({
  path: 'opportunity',
})
export class OpportunityController {
  constructor(
    private readonly opportunityService: OpportunityService
  ) {}

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
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.getSelfOpportunities(req.user.id, instituteId, programId);
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
    @Body('programId') programId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.addtoTodo(req.user.id, opportunityId, instituteId, programId);
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
    @Body('programId') programId: string,
  ): Promise<BasicResponse> {    
    return await this.opportunityService.CreateOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunitiesInfoDto,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.EditDiscreteOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      opportunitiesInfoDto,
      recipientIds,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.changeHidingStatus(
      req.user.id,
      opportunityIds,
      hidingStatus,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.deleteOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityIds,
      message,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.EditGlobalOpportunity(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      opportunitiesInfoDto,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.EditDraftOpportunity(
      req.user.id,
      opportunityId,
      opportunitiesInfoDto,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.CreateDraftOpportunity(
      opportunitiesInfoDto,
      req.user.id,
      req.user.recordTypeName,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.SetDraftOpportunityStatus(
      opportunityId,
      opportunitiesInfoDto,
      req.user.id,
      req.user.recordTypeName,
      instituteId,
      programId,
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
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.getOpportunityDetail(id, instituteId, programId);
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
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.getModificationDetail(
      req.user.id,
      modificationId,
      instituteId,
      programId,
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
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.removalCancel(
      req.user.id,
      opportunityId,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.modificationCancel(
      req.user.id,
      opportunityId,
      instituteId,
      programId,
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
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.getOpportunityComments(
      req.user.id,
      req.user.recordTypeName,
      id,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.createOpportunityComment(
      req.user.id,
      req.user.recordTypeName,
      commentsDto,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.bulkAddOpportunitiesToConsiderations(
      req.user.id,
      opportunities,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.bulkAddConsiderationToToDo(
      req.user.id,
      considerations,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.shareConsideration(
      req.user.id,
      opportunityIds,
      assigneesIds,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ) {
    return await this.opportunityService.bulkDismissConsiderations(
      considerations,
      instituteId,
      programId,
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
    @Body('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.bulkOpportunitiestoTodo(
      req.user.id,
      req.user.recordTypeName,
      opportunityTodoDto,
      instituteId,
      programId,
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
    @QueryRequired('programId') programId: string,  
  ): Promise<any> {
    return await this.opportunityService.getOpportunityUsers(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      instituteId,
      programId,
    );
  }

  /**
   * function to get all the recommend events
   *@param req accessToken
   * return list of recommended events
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Parent,
    Role.Advisor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/event/recommend')
  async getRecommendedEvents(
    @Request() req, 
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    let role = req.user.recordTypeName;
    if (role == Role.Administrator) {
      return await this.opportunityService.getAdminRecommendedEvents(req.user.id, instituteId, programId);
    } else if (role == Role.Advisor) {
      return await this.opportunityService.getAdvisorRecommendedEvents(req.user.id, instituteId, programId);
    } else if (role == Role.Student) {
      return await this.opportunityService.getStudentRecommendedEvents(req.user.id, instituteId, programId);
    } else if (role == Role.Parent) {
      return await this.opportunityService.getParentRecommendedEvents(req.user.id, instituteId, programId);
    } else {
      throw new NotFoundException();
    }
  }

  /**
   * wishlist or unlists the events from recommendations of the student
   * @returns { statusCode, message}
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Observer,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/event/wishlist')
  async whishListEvent(
    @Request() req,
    @Body() wishListDto: WishListDto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ): Promise<any> {
    return await this.opportunityService.wishListEvent(
      req.user.id,
      wishListDto,
      instituteId,
      programId,
    );
  }

  /**
   * Return the Activity List of Student Institute using studentId
   * @param req
   */
   @hasRoles(Role.Student)
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Get('activities/institute')
   async getInstituteActivitiesByStudentId(
     @Request() req, 
     @Query('instituteId') instituteId: string,
     @QueryRequired('programId') programId: string,
    ) {
     const studentId = req.user.id;
     return await this.opportunityService.getStudentInstituteActivities(
       studentId,
       instituteId,
       programId,
     );
   }

  /**
   * Return the List of All Activities except for student persona
   * @param null
   * returns the events
   */
  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Observer,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('explore/activities')
  getExploreViewActivities(
    @Request() req, 
    @Query('instituteId') instituteId: string,
    @QueryRequired('programId') programId: string,
  ): Promise<any> {
    return this.opportunityService.getInstituteActivities(
      null,
      req.user.id,
      instituteId,
      programId,
    );
  }
}

// YML DATA
// custom:
//   serverless-offline: 
//     httpsProtocol: "dev-certs"
//     httpPort: 4000
//     lambdaPort: 4002

