import {
  Body,
  Controller,
  Post,
  Patch,
  Req,
  UseGuards,
  Query,
  Get,
  Param,
} from '@nestjs/common';
import { FirebaseService } from './services/firebase.service';
import { UuidDto } from './dtos/uuid.dto';
import { PushNotificationData } from '@gowebknot/palette-wrapper';

@Controller({
  path: 'firebase',
})
export class FirebaseController {
  constructor(
    private readonly firebaseService: FirebaseService,
  ) {}

  // [TODO] - Add necessary firebase API's Here

  /** store uuid from firebase for the user of palette
   *  @param {UuidDto} body uuid,  salesforce id and email of the user
   * @returns {Object} status code and message or errors
   */
  // @Patch('uuid')
  // async createUuidRecord(
  //   @Body() uuidDto: UuidDto,
  //   @Body('instituteId') instituteId: string,
  // ) {
  //   return await this.firebaseService.updateUuid(uuidDto, instituteId);
  // }

  @Post('testNotif')
  async testNotif(
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
    @Body('userId') sfId: string,
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('data') data?: PushNotificationData,
  ) {
    console.log(
      'sfId',
      sfId,
      'title',
      title,
      'message',
      message,
      'instituteId',
      instituteId,
      'programId',
      programId,
      'data',
      data,
    );

    const response = await this.firebaseService.sendNotification(
      sfId,
      title,
      message,
      instituteId,
      programId,
      data,
    );

    // console.log("response",response);

    return response;
  }
}
