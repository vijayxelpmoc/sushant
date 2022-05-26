import { Body, Controller, Get, Post, UseGuards, Request, Delete, Param, Query, Patch } from '@nestjs/common';
import {
    hasRoles,
    JwtAuthGuard,
    RolesGuard,
    Role,
} from '@gowebknot/palette-wrapper';
import { Errors, Responses } from '@src/constants';
import { NotificationsService } from './notifications.service';
import { BasicDataResponse, BasicResponse } from './dtos/index';
import { QueryRequired } from '@src/decorators';
import { PayloadService } from './payload';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private notificationService: NotificationsService,
        private payloadService: PayloadService,
        // private cachingService: CachingService,
    ) {}

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
    async getNotifications(
        @Request() req,
        @Query('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ): Promise<BasicDataResponse> {
        return await this.notificationService.getNotifications(
            req.user.id, 
            instituteId, 
            programId,
        );
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
    @Get('/:id')
    async getNotificationDetail(
        @Request() req,
        @Param('id') id: string,
        @Query('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ): Promise<BasicDataResponse> {
        return await this.notificationService.getNotificationDetail(
            id,
            req.user.id,
            instituteId,
            programId,
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
    @Patch('readall')
    async makeNotificationsRead(
        @Request() req,
        @Query('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ): Promise<BasicResponse> {
        return await this.notificationService.readNotifications(
            req.user.id, 
            instituteId, 
            programId,
        );
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
    @Patch('read/:id')
    async makeNotificationRead(
        @Request() req,
        @Param('id') id: string,
        @Query('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ): Promise<BasicResponse> {
        return await this.notificationService.readNotification(
            req.user.id, 
            id, 
            instituteId, 
            programId,
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
    async deleteAllNotifications(
        @Request() req, 
        @Query('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.notificationService.deleteAllNotifications(
            req.user.id, 
            instituteId, 
            programId,
        );
    }

    // PAYLOAD APIS

    @Get('/payload/opportunity')
    async opportunityPayload(
        // @Request() req,
        @QueryRequired('oppId') oppId: string, 
        @QueryRequired('userId') userId: string,
        @QueryRequired('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.payloadService.GetOpportunityNotificationData(
            oppId,
            userId, 
            instituteId, 
            programId,
        );
    }

    @Get('/payload/consideration')
    async considerationPayload(
        // @Request() req,
        @QueryRequired('considerationId') considerationId: string, 
        @QueryRequired('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.payloadService.GetConsiderationNotificationData(
            considerationId,
            instituteId, 
            programId,
        );
    }

    @Get('/payload/modification')
    async modificationPayload(
        // @Request() req,
        @QueryRequired('modificationId') modificationId: string, 
        @QueryRequired('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.payloadService.GetModificationNotificationData(
            modificationId,
            instituteId, 
            programId,
        );
    }

    @Get('/payload/todo')
    async todoPayload(
        // @Request() req,
        @QueryRequired('todoId') todoId: string, 
        @QueryRequired('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.payloadService.GetTodoNotificationData(
            todoId,
            instituteId, 
            programId,
        );
    }

    @Get('/payload/approval')
    async approvalPayload(
        // @Request() req,
        @QueryRequired('notificationId') notificationId: string, 
        @QueryRequired('instituteId') instituteId: string,
        @QueryRequired('programId') programId: string,
    ) {
        return await this.payloadService.GetOpportunityApprovalNotificationData(
            notificationId,
            instituteId, 
            programId,
        );
    }

    
}
