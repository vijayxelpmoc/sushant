import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Role,
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
} from '@gowebknot/palette-wrapper';

import {
  RecommendEventDto,
  AcceptRecommendationDto,
  DeclineRecommendationDto,
} from './dtos';

import { EventsService } from './events.service';

@Controller({
  path: 'event',
  version: '1',
})
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * function to get all the recommend events
   *@param req accessToken
   * return list of recommended events
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Event Recommendation Data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Get('recommend')
  async getRecommendedEvents(@Request() req) {
    return await this.eventsService.getRecommendedEvents(req.user.id);
  }

  /**
   * function to recommend event to a student by parent and advisor
   *@param eventid contains eventId
   * return status code and errors
   */
  @hasRoles(Role.Parent, Role.Advisor, Role.Faculty)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Event Recommendation Created ' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: RecommendEventDto })
  @Post('recommend')
  async recommendEvent(
    @Body() recommendEventDto: RecommendEventDto,
    @Request() req,
  ) {
    return await this.eventsService.recommendEvent(
      req.user.id,
      recommendEventDto,
    );
  }

  /**
   * function to accept a recommended event -> when a student accepts a recommendation
   *@param acceptRecommendationDto contains event id
   * return status code and errors
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Event Recommendation Accepted ' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: AcceptRecommendationDto })
  @Post('accept')
  async acceptRecommendation(
    @Body() acceptRecommendationDto: AcceptRecommendationDto,
    @Request() req,
  ) {
    return await this.eventsService.acceptRecommendation(
      req.user.id,
      acceptRecommendationDto,
    );
  }

  /**
   * function to delete a recommended event -> when a student declines a recommendation
   *@param recommendationid contains recommendation id
   * return status code and errors
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Event Recommendation Declined ' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: DeclineRecommendationDto })
  @Post('decline')
  async declineRecommendation(
    @Body() declineRecommendationDto: DeclineRecommendationDto,
  ) {
    return await this.eventsService.declineRecommendation(
      declineRecommendationDto,
    );
  }
}
