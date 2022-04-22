import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import Cryptr from 'cryptr';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { Errors, Responses } from '@src/constants';
import { PreRegisterUserDto, AddProfilePictureDto } from './dto';
import { User, Roles } from './types';

@Injectable()
export class UsersService {
  private _cryptr: Cryptr;
  constructor(private sfService: SfService) {
    this._cryptr = new Cryptr(process.env.PASSWORD_HASHING_KEY);
  }

  async preRegisterForPalette(preRegisterUserDto: PreRegisterUserDto) {
    const { email, password, ferpa, role } = preRegisterUserDto;
    const user: User = (
      await this.sfService.generics.contacts.get(
        'Id, Name, Palette_Email__c, RecordTypeId, Phone, IsRegisteredOnPalette__c, Palette_Key__c, Record_Type_Name__c',
        {
          Palette_Email__c: email,
        },
      )
    )[0];
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }

    // Check if user is already registered
    if (user.IsRegisteredOnPalette__c === true) {
      throw new UnauthorizedException(Errors.PRE_REGISTERED_ERROR);
    }

    const isStudentOrGuardian =
      role === Roles.Student || role === Roles.Guardian;

    if (isStudentOrGuardian && !ferpa) {
      throw new ForbiddenException(Errors.FERPA_NOT_ACCEPTED);
    }

    // Encrypt the new password and update the user
    const newPasswordHash = this._cryptr.encrypt(password);

    isStudentOrGuardian
      ? await this.sfService.generics.contacts.update(user.Id, {
          Palette_Key__c: newPasswordHash,
          hed__FERPA__c: true,
        })
      : await this.sfService.generics.contacts.update(user.Id, {
          Palette_Key__c: newPasswordHash,
        });

    await this.sfService.generics.contacts.update(user.Id, {
      IsRegisteredOnPalette__c: true,
    });

    const [fName, lName] = user.Name.split(' ');
    return {
      statusCode: 200,
      message: Responses.PRE_REGISTER_SUCCESS,
      data: {
        id: user.Id,
        firstName: fName,
        lastName: lName || '',
        email: user.Palette_Email__c,
        role: user.Record_Type_Name__c,
      },
    };
  }

  async addProfilePicture(
    addProfilePictureDto: AddProfilePictureDto,
    userId: string,
  ) {
    await this.sfService.generics.contacts.update(userId, {
      Profile_Picture__c: addProfilePictureDto.url,
    });
    return {
      statusCode: 200,
      message: Responses.ADD_PROFILE_PICTURE_SUCCESS,
    };
  }
}
