import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Cryptr from 'cryptr';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { Errors, Responses } from '@src/constants';
import { PreRegisterUserDto, AddProfilePictureDto } from './dto';
import { User, Roles } from './types';
// const Cryptr = require('cryptr');
import { EnvKeys } from '@src/constants';
import { AuthService } from '../auth/auth.service';
import { UuidDto } from './dto/uuid.dto';

@Injectable()
export class UsersService {
  // private _cryptr: Cryptr;
  constructor(
    private sfService: SfService,
    private configService: ConfigService,
    private authService: AuthService,
    ) {
    // this._cryptr = new Cryptr(EnvKeys.PASSWORD_HASHING_KEY);
  }

  async preRegisterForPalette(preRegisterUserDto: PreRegisterUserDto, instituteId: string, programId: string) {
    const { email, password, ferpa, role } = preRegisterUserDto;

    const user: User = (
      await this.sfService.generics.contacts.get(
        'Id, Name, Palette_Email, Contact_Record_Type, Phone, IsRegisteredOnPalette, Palette_Key, Record_Type_Name',
        {
          Palette_Email: email,
          Primary_Educational_Institution: programId,
          Record_Type_Name: role,
        },
        {},
        instituteId,
      )
    )[0];
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }
    
    // Check if user is already registered
    if (user.IsRegisteredOnPalette === true) {
      throw new UnauthorizedException(Errors.PRE_REGISTERED_ERROR);
    }

    const isStudentOrGuardian = role === Roles.Student || role === Roles.Guardian;

    if (isStudentOrGuardian && !ferpa) {
      throw new ForbiddenException(Errors.FERPA_NOT_ACCEPTED);
    }
    
    // Encrypt the new password and update the user
    const cryptr = new Cryptr(EnvKeys.PASSWORD_HASHING_KEY);
    const newPasswordHash = cryptr.encrypt(password);
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
    
    await this.sfService.generics.contacts.update(user.Id, {
      IsRegisteredOnPalette: true,
    },
    instituteId
    );

    const [fName, lName] = user.Name.split(' ');
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
    programId,
    role,
  ) {
    const user = await this.authService._getUser({
        Primary_Educational_Institution: programId,
        Record_Type_Name: role,
      }, 
      {}, 
      instituteId
    );

    if (!user) {
      throw new NotFoundException();
    }

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

  /** store uuid from firebase for the user of palette
   *  @param {UuidDto} body uuid,  salesforce id and email of the user
   * @returns {Object} status code and message or errors
   */
   async updateUuid(uuidDto: UuidDto, instituteId: string, programId: string, role: string): Promise<any> {
    const user = await this.sfService.generics.contacts.get('Id', { Id: uuidDto.SFId, Primary_Educational_Institution: programId, Record_Type_Name: role }, {}, instituteId);
    
    if (user.length == 0) {
      throw new NotFoundException();
    }

    let data;
    if (process.env.NODE_ENV === 'prod') {
      data = {
        prod_uuid: uuidDto.uuid,
      };
    } else {
      data = {
        dev_uuid: uuidDto.uuid,
      };
    }

    return await this.sfService.generics.contacts.update(uuidDto.SFId, data, instituteId);
  }
}
