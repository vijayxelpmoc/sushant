import {
  Body,
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  Role,
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
} from '@gowebknot/palette-wrapper';

import { ActivitiesService } from './activities.service';
import { ResponseInstituteEvents } from './types/activity-interface';

@Controller({
  path: 'activities',
  version: '1',
})
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Return the Activity List of Student Using studentId
   * @param req
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  async getStudentActivities(@Request() req) {
    const studentId = req.user.id;
    return await this.activitiesService.getStudentActivities(studentId);
  }

  /**
   * Return the Activity List of Student Institute using studentId
   * @param req
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('institute')
  async getInstituteActivitiesByStudentId(@Request() req) {
    const studentId = req.user.id;
    return await this.activitiesService.getStudentInstituteActivities(
      studentId,
    );
  }

  /**
   * Return the Activity List of Student Institute using studentId for other roles
   * @param req
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
  @Get('institute/:studentId')
  async getEventsOfStudentInstitute(@Param('studentId') studentId: string) {
    return await this.activitiesService.getStudentInstituteActivities(
      studentId,
    );
  }

  /**
   * Return the Activity List of  Institute using InstituteId
   * @param instituteId - id of the institute
   * returns the events
   */
  @hasRoles(Role.Parent, Role.Advisor, Role.Faculty, Role.Parent)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('explore/institute')
  async getExploreViewInstituteActivities(
    @Body('instituteId') instituteId: string,
  ): Promise<ResponseInstituteEvents> {
    return await this.activitiesService.getInstituteActivities(instituteId);
  }

  /**
   * Return the List of All Activities
   * @param null
   * returns the events
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
  @Get('explore/activities')
  async getExploreViewActivities(
    @Request() req,
  ): Promise<ResponseInstituteEvents> {
    if (req.user.RecordTypeName === Role.Student) {
      return await this.activitiesService.getInstituteActivities(
        null,
        req.user.id,
      );
    }
    return await this.activitiesService.getInstituteActivities('', req.user.id);
  }

  /**
   * Return the Detail of an Activity using activityId
   * @param req
   * @param activityId
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('activities/:activityId')
  async getActivityDetailUsingId(
    @Request() req,
    @Param('activityId') activityId: string,
  ) {
    const studentId = req.user.id;
    return await this.activitiesService.getActivityDetailUsingId(
      studentId,
      activityId,
    );
  }
}
