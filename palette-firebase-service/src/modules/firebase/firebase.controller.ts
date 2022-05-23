import { Body, Controller, Post, Patch, Req, UseGuards, Query, Get, Param } from '@nestjs/common';
import { FirebaseService } from './services/firebase.service';
import { FirebaseChatBackupService } from './services/firebase-chat-backup.service';
import { UuidDto } from './dtos/uuid.dto';

@Controller({
  path: 'firebase',
})
export class FirebaseController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly firebaseChatBackupService: FirebaseChatBackupService,
  ) {}

  // [TODO] - Add necessary firebase API's Here

  // /** store uuid from firebase for the user of palette
  //  *  @param {UuidDto} body uuid,  salesforce id and email of the user
  //  * @returns {Object} status code and message or errors
  //  */
  //  @Patch('uuid')
  //  async createUuidRecord(
  //    @Body() uuidDto: UuidDto, 
  //    @Body('instituteId') instituteId: string
  //   ) {
  //    return await this.firebaseService.updateUuid(uuidDto, instituteId);
  //  }
}
