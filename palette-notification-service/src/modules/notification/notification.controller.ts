import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  hasRoles,
  JwtAuthGuard,
  Role,
  RolesGuard,
} from '@gowebknot/palette-wrapper';
import {
  BasicDataResponse,
  BasicDataResponseDto,
  BasicResponse,
} from '@src/dto/notificationDtos.dto';

@Controller({
  path: 'notification',
})
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * Return the Notification List of Student Using studentId
   * @param req
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Observer,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets all notification of a user.',
    type: BasicDataResponseDto,
  })
  async getNotifications(
    @Request() req,
    @Query() instituteId: string,
  ): Promise<BasicDataResponse> {
    console.log(req.user,instituteId);
    
    return await this.notificationService.getNotifications(
      req.user.id,
      instituteId,
    );
  }

  // @Get('test')
  // async testnoti() {
  //   return await this.notificationService.testing();
  // }

  /**
   * Return the Notification List of Student Using studentId
   * @param req
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Observer,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets notification detail.',
    type: BasicDataResponseDto,
  })
  async getNotificationDetail(
    @Request() req,
    @Param('id') id: string,
    @Query() instituteId: string,
  ): Promise<BasicDataResponse> {
    return await this.notificationService.getNotificationDetail(
      id,
      req.user.id,
      instituteId,
    );
  }

  /**
   * Marks read all the Notifications of user.
   * @param req
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Observer,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('readall')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Marks all notifications as read for a user.',
    type: BasicDataResponseDto,
  })
  makeNotificationsRead(
    @Request() req,
    @Query() instituteId: string,
  ): Promise<BasicResponse> {
    return this.notificationService.readNotifications(req.user.id, instituteId);
  }

  /**
   * Return the Notification List of Student Using studentId
   * @param req
   */
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Observer,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('read/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns all notifications of a student from their ID',
    type: BasicDataResponseDto,
  })
  makeNotificationRead(
    @Request() req,
    @Param('id') id: string,
    @Query() instituteId: string,
  ): Promise<BasicResponse> {
    return this.notificationService.readNotification(
      req.user.id,
      id,
      instituteId,
    );
  }

  //Delete all notifications of the logged in user
  @hasRoles(
    Role.Student,
    Role.Administrator,
    Role.Advisor,
    Role.Observer,
    Role.Parent,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/deleteAll')
  deleteAllNotifications(@Request() req, @Query() instituteId: string) {
    return this.notificationService.deleteAllNotifications(
      req.user.id,
      instituteId,
    );
  }
}
