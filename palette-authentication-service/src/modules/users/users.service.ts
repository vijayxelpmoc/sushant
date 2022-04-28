import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Cryptr from 'cryptr';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { Errors, Responses } from '@src/constants';
import { PreRegisterUserDto, AddProfilePictureDto } from './dto';
import { User, Roles } from './types';
// const Cryptr = require('cryptr');

@Injectable()
export class UsersService {
  // private _cryptr: Cryptr;
  constructor(
    private sfService: SfService,
    private configService: ConfigService
    ) {
    // this._cryptr = new Cryptr(process.env.PASSWORD_HASHING_KEY);
  }

  async preRegisterForPalette(preRegisterUserDto: PreRegisterUserDto, instituteId: string) {
    const { email, password, ferpa, role } = preRegisterUserDto;

    const user: User = (
      await this.sfService.generics.contacts.get(
        'Id, Name, Palette_Email, Contact_Record_Type, Phone, IsRegisteredOnPalette, Palette_Key, Record_Type_Name',
        {
          Palette_Email: email,
        },
        {},
        instituteId,
      )
    )[0];
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }

    console.log('user', user);
    
    // Check if user is already registered
    if (user.IsRegisteredOnPalette === true) {
      throw new UnauthorizedException(Errors.PRE_REGISTERED_ERROR);
    }

    const isStudentOrGuardian = role === Roles.Student || role === Roles.Guardian;

    if (isStudentOrGuardian && !ferpa) {
      throw new ForbiddenException(Errors.FERPA_NOT_ACCEPTED);
    }

    // Encrypt the new password and update the user
    const cryptr = new Cryptr(this.configService.get<string>('PASSWORD_HASHING_KEY'));
    const newPasswordHash = cryptr.encrypt(password);
    console.log('newPasswordHash', newPasswordHash);
    isStudentOrGuardian
      ? await this.sfService.generics.contacts.update(user.Id, {
          Palette_Key: newPasswordHash,
          FERPA: true,
        },
        instituteId,
        )
      : await this.sfService.generics.contacts.update(user.Id, {
          Palette_Key: newPasswordHash,
        },
        instituteId,
        );
    console.log('isStudentOrGuardian', isStudentOrGuardian);
    
    await this.sfService.generics.contacts.update(user.Id, {
      IsRegisteredOnPalette: true,
    },
    instituteId
    );
    console.log('updated');

    const [fName, lName] = user.Name.split(' ');
    console.log('fName', fName);
    console.log('lName', lName);
    return {
      statusCode: 200,
      message: Responses.PRE_REGISTER_SUCCESS,
      data: {
        id: user.Id,
        firstName: fName,
        lastName: lName || '',
        email: user.Palette_Email,
        role: user.Record_Type_Name,
      },
    };
  }

  async addProfilePicture(
    addProfilePictureDto: AddProfilePictureDto,
    userId: string,
    instituteId,
  ) {
    await this.sfService.generics.contacts.update(userId, {
      Profile_Picture: addProfilePictureDto.url,
    }, 
    instituteId
    );
    return {
      statusCode: 200,
      message: Responses.ADD_PROFILE_PICTURE_SUCCESS,
    };
  }
}
