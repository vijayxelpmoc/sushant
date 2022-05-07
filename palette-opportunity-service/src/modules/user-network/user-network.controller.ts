import {
  hasRoles,
  JwtAuthGuard,
  Role,
  RolesGuard,
} from '@gowebknot/palette-wrapper';
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
import { UserNetworkService } from './user-network.service';

@Controller({
  path: 'userNetwork',
})
export class UserNetworkController {
  constructor(private readonly userNetworkService: UserNetworkService) {}

  @hasRoles(
    Role.Parent,
    Role.Student,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('contactsList')
  async getContactsList(
    @Request() req,
    @Query('instituteId') instituteId: string,
  ) {
    console.log(instituteId);

    return await this.userNetworkService.getContactsList(
      req.user.id,
      req.user.recordTypeName,
      instituteId,
    );
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
  @Get('share/recipients/:opportunityId') // 2
  async getShareRecipients(
    @Request() req,
    @Param('opportunityId') opportunityId: string,
    @Query('instituteId') instituteId: string,
  ): Promise<any> {
    return await this.userNetworkService.getOppShareRecipients(
      req.user.id,
      req.user.recordTypeName,
      opportunityId,
      instituteId,
    );
  }
}
