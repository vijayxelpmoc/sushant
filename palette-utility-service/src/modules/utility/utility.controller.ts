import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
  Role,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
import { UtilityService } from './utility.service';
import { ContactInfoDto, ReportIssueDto, FeedbackInfoDto } from './dto';

@ApiTags('utility')
@Controller({
  path: 'util',
  version: '1',
})
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('contact')
  @ApiOkResponse({ description: Responses.CONTACT_US_SUCCESS })
  @ApiInternalServerErrorResponse({ description: Errors.CONTACT_US_FAILED })
  @ApiBody({ type: ContactInfoDto })
  async contact(@Body() contactInfoDto: ContactInfoDto) {
    return this.utilityService.contactUs(contactInfoDto);
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('feedback')
  @ApiOkResponse({ description: Responses.FEEDBACK_SUCCESS })
  @ApiInternalServerErrorResponse({
    description: Errors.FEEDBACK_SUBMIT_FAILED,
  })
  @ApiBody({ type: FeedbackInfoDto })
  async feedback(@Body() feedbackInfoDto: FeedbackInfoDto) {
    return this.utilityService.addFeedback(feedbackInfoDto);
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('report/issue')
  @ApiOkResponse({ description: Responses.REPORT_ISSUE_SUCCESS })
  @ApiInternalServerErrorResponse({ description: Errors.REPORT_ISSUE_FAILED })
  @ApiBody({ type: ReportIssueDto })
  async reportIssue(@Body() reportIssueDto: ReportIssueDto) {
    return this.utilityService.addReportIssue(reportIssueDto);
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('guides')
  @ApiOkResponse({ description: Responses.GUIDES_SUCCESS })
  @ApiNotFoundResponse({ description: Errors.GUIDES_NOT_FOUND })
  getGuides(@Req() req) {
    return this.utilityService.getGuides(req.user.RecordTypeName);
  }
}
