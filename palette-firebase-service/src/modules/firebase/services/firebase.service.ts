import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Role,
  Notifier,
  NotificationType,
  EmailTemplates,
} from '@gowebknot/palette-wrapper';
import * as admin from 'firebase-admin';
import { SfService } from '@gowebknot/palette-salesforce-service';

import {
  Contact,
  FirestoreUser,
  PushNotificationData,
  SFContact,
} from '../types';
import { UuidDto } from '../dtos/uuid.dto';
import { Errors } from '../../../constants';

@Injectable()
export class FirebaseService {
  constructor(private sfService: SfService) {}

  /*
   * [TODO] - Methods to be implemented
   * updateUuid - L64
   *
   * [CHANGELOG] - Changed method definitions
   * updatePassword -> updateUserPassword
   * deleteContact -> deleteUser
   *
   */

  // /** store uuid from firebase for the user of palette
  //  *  @param {UuidDto} body uuid,  salesforce id and email of the user
  //  * @returns {Object} status code and message or errors
  //  */
  //  async updateUuid(uuidDto: UuidDto, instituteId: string): Promise<any> {
  //   let data;
  //   if (process.env.NODE_ENV === 'prod') {
  //     data = {
  //       prod_uuid: uuidDto.uuid,
  //     };
  //   } else {
  //     data = {
  //       dev_uuid: uuidDto.uuid,
  //     };
  //   }

  //   return await this.sfService.generics.contacts.update(uuidDto.SFId, data, instituteId);
  // }

  private _mapContactUUID(contact: SFContact): Contact {
    return {
      sfId: contact.Id,
      email: contact.Email,
      uuid: contact[
        process.env.NODE_ENV === 'development' ? 'dev_uuid' : 'prod_uuid'
      ],
    };
  }

  // Public Methods

  async getAllUuidRecords() {
    const sfContacts: SFContact[] = await this.sfService.generics.contacts.get(
      'Id, Name, Email, prod_uuid, dev_uuid',
      {},
    );
    const contacts: Contact[] = sfContacts.map(this._mapContactUUID);
    return contacts;
  }

  async getUuidWithSFId(
    sfId: string | string[],
    instituteId: string,
    programId: string,
  ) {
    const sfContacts: SFContact[] = await this.sfService.generics.contacts.get(
      'Id, Name, Email, prod_uuid, dev_uuid',
      {
        Id: sfId,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );
    // console.log('sfContacts', sfContacts);

    if (!sfContacts.length) {
      throw new NotFoundException(Errors.SFID_NOT_FOUND);
    }
    const contacts: Contact[] = sfContacts.map(this._mapContactUUID);

    return Array.isArray(sfId) ? contacts : contacts[0];
  }

  // async updateUserPassword(sfId: string, password: string) {
  //   const uuid = ((await this.getUuidWithSFId(sfId,instituteId,programId)) as Contact).uuid;
  //   if (!uuid) {
  //     throw new NotFoundException(Errors.SFID_NOT_FOUND);
  //   }
  //   await admin.auth().updateUser(uuid, {
  //     password,
  //   });
  // }

  // async deleteUser(sfId: string) {
  //   // [TODO] - Check for Boolean Implementation
  //   const uuid = ((await this.getUuidWithSFId(sfId,instituteId,programId)) as Contact).uuid;
  //   if (!uuid) {
  //     throw new NotFoundException(Errors.SFID_NOT_FOUND);
  //   }
  //   await admin.auth().deleteUser(uuid);
  // }

  // async unRegisterUser(uuid: string) {
  //   await admin.auth().deleteUser(uuid);
  //   const firestore = new admin.firestore.Firestore();
  //   const doc = firestore.collection('/users').doc(uuid);
  //   doc ?? doc.delete();
  // }

  // Service Methods

  async sendNotification(
    sfId: string,
    title: string,
    body: string,
    payload: any,
    instituteId: string,
    programId: string
  ) {
    const uuid = ((await this.getUuidWithSFId(sfId, instituteId, programId)) as Contact).uuid;
    
    if (!uuid) {
      throw new NotFoundException(Errors.SFID_NOT_FOUND);
    }

    const _db = admin.firestore();
    
    const _messaging = admin.messaging();

    const userDoc = await _db.collection('users').doc(uuid).get();
    if (!userDoc.exists) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }
    const user = await userDoc.data();
    if (user.fcmTokens && user.fcmTokens.length > 0) {  
      const message: any = {
        tokens: user.fcmTokens,
        notification: {
          title,
          body,
        },
      };
      
      if (payload) {
        message.data = {
          type: payload.type,
          data: JSON.stringify(payload.data),
        };
      }
      
      const send = await _messaging.sendMulticast(message);
      
      return send; 
      // return await _messaging.sendMulticast(message);
    }
  }

  // async deleteFile(path: string) {
  //   const bucket = admin.storage().bucket();
  //   await bucket.file(path).delete();
  // }
}
