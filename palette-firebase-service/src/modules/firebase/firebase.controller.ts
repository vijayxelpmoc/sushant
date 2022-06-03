import { Body, Controller, Post, Patch, Req, UseGuards, Query, Get, Param } from '@nestjs/common';
// import { FirebaseChatBackupService } from './services/firebase-chat-backup.service';
import { FirebaseService } from './services/firebase.service';
import { UuidDto } from './dtos/uuid.dto';


@Controller('firebase')
export class FirebaseController {
    constructor(
        private readonly firebaseService: FirebaseService,
        // private readonly firebaseChatBackupService: FirebaseChatBackupService,
    ) {}
    
    @Post('send-notification')
    async sendNotification(
        @Body('sfId') sfId: string,
        @Body('title') title: string,
        @Body('body') body: string,
        @Body('payload') payload: string,
        @Body('instituteId') instituteId: string,
        @Body('programId') programId: string,
    ) {
        return await this.firebaseService.sendNotification(sfId, title, body, payload, instituteId, programId);
    }
} 
