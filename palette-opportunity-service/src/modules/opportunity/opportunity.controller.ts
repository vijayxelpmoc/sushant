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
  constructor(
    private readonly opportunityService: OpportunityService
  ) {}

  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('others')
  async createOpportunityOtherRole(
    @Request() req,
    @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('AssigneeId') assigneeId: string,
    @Body('InstituteId') InstituteId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.CreateOpportunityOtherRoles(
      opportunitiesInfoDto,
      req.user.id,
      assigneeId,
      InstituteId,
      instituteId,
    );
  }

  /** gets all self created opportunities
  *  @param {userId} string user id
  * @returns {Object} status code and message and opportunity information
  */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getLinkedOpportunites(
    @Request() req,
    @Query('instituteId') instituteId: string,  
  ): Promise<any> {
    return await this.opportunityService.getLinkedOpportunities(
      req.user.id,
      instituteId,
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
  @Patch('/update')
  update(
    @Request() req,
    @Body('updateData') opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ) {
    return this.opportunityService.updateOpportunity(
      opportunitiesInfoDto,
      opportunityId,
      req.user.id,
      instituteId,
    );
  }

  /** creates opportunity for multiple students
  *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  *  @param {userId} string user id
  * @returns {Object} status code and message
  */
  @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('multi')
  async CreateOpportunityForMultipleStudents(
    @Request() req,
    @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
    @Body('assignees') assignees: string[],
    @Body('InstituteId') InstituteId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.CreateOpportunityForMultipleStudents(
      opportunitiesInfoDto,
      req.user.id,
      assignees,
      InstituteId,
      instituteId,
    );
  }

  /** adds opportunites in bulk to to do for students
  *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  *  @param {userId} string user id
  * @returns {Object} status code and message
  */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk/edit/student')
  async bulkEditOpportunitiesStudent(
    @Request() req,
    @Body('opportunities') opportunities: string[],
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.bulkEditOpportunitiesStudent(
      req.user.id,
      opportunities,
      instituteId,
    );
  }

  /** adds opportunites in bulk to to do for otherss
  *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  *  @param {userId} string user id
  * @returns {Object} status code and message
  */
   @hasRoles(
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk/edit/others')
  async bulkEditOpportunitiesOthers(
    @Request() req,
    @Body('OpportunitiesInfoDto') OpportunitiesInfoDto: OpportunitiesInfoDto[],
    @Body('assigneeId') assigneeId: string,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.opportunityService.bulkEditOpportunitiesOthers(
      req.user.id,
      assigneeId,
      OpportunitiesInfoDto,
      instituteId,
    );
  }

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
  @Post('add/considerations/:considerationId')
  async ConsiderOpportunities(
    @Request() req,
    @Body('considerationId') considerationId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.addtoConsiderations(
      req.user.id,
      considerationId,
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
  @Post('single/add/todo/')
  async todoOpportunities(
    @Request() req,
    @Body('opportunityId') opportunityId: string,
    @Body('instituteId') instituteId: string,
  ): Promise<BasicResponse> {
    return await this.opportunityService.addtoTodo(req.user.id, opportunityId, instituteId);
  }

  // /** creates opportunity
  //  *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  //  *  @param {userId} string user id
  //  * @returns {Object} status code and message
  //  */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('add')
  // async CreateOpportunity(
  //   @Request() req,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('assignees') assignees: string[],
  //   @Body('InstituteId') InstituteId: string,
  // ): Promise<BasicResponse> {
  //   try {
  //     return await this.opportunityService.CreateOpportunity(
  //       opportunitiesInfoDto,
  //       req.user.id,
  //       assignees,
  //       InstituteId,
  //       req.user.RecordTypeName,
  //     );
  //   } catch (err) {
  //     throw new NotFoundException('Oops ! Somethiing Went wrong.');
  //   }
  // }

  // /* Patch API for editing a discrete student opportunity */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('/edit/discrete')
  // async editDiscreteOpportunites(
  //   @Request() req,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('opportunityId') opportunityId: string,
  //   @Body('recipientIds') recipientIds: string[],
  // ) {
  //   return await this.opportunityService.EditDiscreteOpportunity(
  //     req.user.id,
  //     opportunityId,
  //     opportunitiesInfoDto,
  //     recipientIds,
  //     req.user.RecordTypeName,
  //   );
  // }

  // /* PATCH API for editing to allow bulk hiding/unhiding opportunities */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('/visibility')
  // async hideAndUnhideBulkOpportunites(
  //   @Request() req,
  //   @Body('hidingStatus') hidingStatus: string,
  //   @Body('opportunityIds') opportunityIds: string[],
  // ) {
  //   return await this.opportunityService.changeHidingStatus(
  //     req.user.id,
  //     opportunityIds,
  //     hidingStatus,
  //   );
  // }

  // /* Delete API for editing a student opportunity */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('/delete') // Soft delete
  // async deleteOpportunites(
  //   @Request() req,
  //   @Body('opportunityIds') opportunityIds: string[],
  //   @Body('message') message: string,
  // ) {
  //   return await this.opportunityService.deleteOpportunity(
  //     req.user.id,
  //     opportunityIds,
  //     message,
  //     req.user.RecordTypeName,
  //   );
  // }

  // /* API for suggesting edit of a Global Student Opportunity */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('/edit/global')
  // async suggestingEditGlobalOpportunity(
  //   @Request() req,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: OpportunitiesInfoDto,
  //   @Body('opportunityId') opportunityId: string,
  // ): Promise<any> {
  //   return await this.opportunityService.EditGlobalOpportunity(
  //     req.user.id,
  //     opportunityId,
  //     opportunitiesInfoDto,
  //     req.user.RecordTypeName,
  //   );
  // }

  // /* API for suggesting edit of a Global Student Opportunity */
  // @hasRoles(
  //   Role.Student,
  //   Role.Observer,
  //   Role.Administrator,
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('/edit/draft')
  // async suggestingEditDraftOpportunity(
  //   @Request() req,
  //   @Body('opportunityId') opportunityId: string,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: draftInfoDto,
  //   @Body('assignees') assignees: string[],
  //   @Body('InstituteId') InstituteId: string,
  // ): Promise<any> {
  //   return await this.opportunityService.EditDraftOpportunity(
  //     req.user.id,
  //     opportunityId,
  //     opportunitiesInfoDto,
  //     assignees,
  //     InstituteId,
  //   );
  // }

  // /** creates draft opportunity
  //  *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
  //  *  @param {userId} string user id
  //  * @returns {Object} status code and message
  //  */
  // @hasRoles(
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  //   Role.Administrator,
  //   Role.Student,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('draft')
  // async CreateDraftOpportunity(
  //   @Request() req,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: draftInfoDto,
  //   @Body('assignees') assignees: string[],
  //   @Body('InstituteId') InstituteId: string,
  // ): Promise<BasicResponse> {
  //   return await this.opportunityService.CreateDraftOpportunity(
  //     opportunitiesInfoDto,
  //     req.user.id,
  //     assignees,
  //     InstituteId,
  //     req.user.RecordTypeName,
  //   );
  // }

  // // Create an API to change the status of a draft opportunity to live (Available / In Review)
  // @hasRoles(
  //   Role.Parent,
  //   Role.advisor,
  //   Role.faculty,
  //   Role.Administrator,
  //   Role.Student,
  // )
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('draft/live')
  // async setDraftOpportunityStatus(
  //   @Request() req,
  //   @Body('opportunityId') opportunityId: string,
  //   @Body('opportunitiesInfoDto') opportunitiesInfoDto: draftInfoDto,
  //   @Body('assignees') assignees: string[],
  //   @Body('InstituteId') InstituteId: string,
  // ) {
  //   return await this.opportunityService.SetDraftOpportunityStatus(
  //     opportunityId,
  //     opportunitiesInfoDto,
  //     assignees,
  //     InstituteId,
  //     req.user.id,
  //     req.user.RecordTypeName,
  //   );
  // }
}
