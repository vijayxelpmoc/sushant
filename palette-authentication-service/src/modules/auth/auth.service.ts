import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// import Cryptr from 'cryptr';
import { v4 as uuid } from 'uuid';

import {
  Role,
  Notifier,
  NotificationType,
  EmailTemplates,
} from '@gowebknot/palette-wrapper';
// import { SfService, SFField } from '@gowebknot/palette-salesforce-service';

import { AccountRecordType, Errors, Responses } from '@src/constants';
import { User } from '@src/modules/users/types';
import { OtpChecks } from '@src/modules/auth/types';
import {
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthResetPasswordDto,
  AuthValidateDto,
  AuthForgotPasswordValidateOtpDto,
} from './dto';
import { OtpManager } from './entities/otpManager.entity';
import { AuthForgotPasswordSetNewDto } from './dto/auth-forgot-password-set-new.dto';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { SFField } from '@gowebknot/palette-salesforce-service';
import Cryptr from 'cryptr';
import { EnvKeys } from '@src/constants';

@Injectable()
export class AuthService {
  // private _cryptr: Cryptr;
  private _notifier: Notifier;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private sfService: SfService, 
    private jwtService: JwtService, 
    private configService: ConfigService
  ) {
    // this._cryptr = new Cryptr(configService.get<string>('PASSWORD_HASHING_KEY'));
    this._notifier = new Notifier();
  }

  // Util Methods

  async _generateJwtToken(user: User) {
    const payload = {
      id: user.Id,
      recordTypeName: user.Record_Type_Name,
      name: user.Name,
      email: user.Palette_Email,
      isRegisteredOnPalette: user.IsRegisteredOnPalette,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '10d',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '120d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  _generateHash(len: number): string {
    const set =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return (
      Array(len)
        .join()
        .split(',')
        .map(() => set.charAt(Math.floor(Math.random() * set.length)))
        .join('') + '/'
    );
  }

  async _getUser(identifier: SFField, sort?: SFField, instituteId?: string): Promise<User> {
    const _userFields =
      'Id, Palette_Email, Name, Contact_Record_Type, Phone, IsRegisteredOnPalette, Palette_Key, Record_Type_Name, prod_uuid, dev_uuid, Is_Deactive';

    const user: User = (
      await this.sfService.generics.contacts.get(_userFields, identifier, sort, instituteId)
    )[0];
    
    return user;
  }

  // Service Methods

  async validateUser(authValidateDto: AuthValidateDto, instituteId: string,  programId: string, role: string) {
    const user = await this._getUser({
      Palette_Email: authValidateDto.email,
      Primary_Educational_Institution: programId,
      Record_Type_Name: role,
    },
    {},
    instituteId,
    );

    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    const preRegistered =
      user.Palette_Key !== null || user.IsRegisteredOnPalette;

    return {
      statusCode: 200,
      message: preRegistered
        ? Responses.USER_REGISTERED_SUCCESS
        : Responses.USERS_FOUND_SUCCESS,
      data: {
        role: user.Record_Type_Name,
      },
    };
  }

  async login(authLoginDto: AuthLoginDto, instituteId: string, programId: string, role: string) {
    this.logger.log('NEW login Request');
  
    const user = await this._getUser({ 
        Palette_Email: authLoginDto.email,
        Primary_Educational_Institution: programId,
        Record_Type_Name: role,
      },
      {},
      instituteId,
    );
    
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }
    

    // Validate the password
    // [INFO] The monolith implementation of Palette uses Cryptr for hashing,
    // hence to keep the auth working for old users, cryptr is being used here
    // instead of bcrypt.
    const cryptr = new Cryptr(EnvKeys.PASSWORD_HASHING_KEY);
    const decryptedPassword = cryptr.decrypt(user.Palette_Key);
    if (authLoginDto.password !== decryptedPassword) {
      throw new UnauthorizedException(Errors.INVALID_PASSWORD);
    }

    // Check if user is pre registered
    if (user.IsRegisteredOnPalette === false) {
      throw new UnauthorizedException(Errors.NOT_REGISTERED_ERROR);
    }

    // Check if account is active
    if (user.Is_Deactive === true) {
      throw new UnauthorizedException(Errors.ACCOUNT_SUSPENDED);
    }

    const uuid =
      process.env.NODE_ENV === 'production'
        ? user.prod_uuid
        : user.dev_uuid;

    return {
      statusCode: 200,
      message: Responses.LOGIN_SUCCESS,
      data: {
        id: user.Id,
        role: user.Record_Type_Name,
        uuid,
        tokens: { ...(await this._generateJwtToken(user)) },
      },
    };
  }

  async resetPassword(
    authResetPasswordDto: AuthResetPasswordDto,
    userId: string,
    instituteId: string, 
    programId: string, 
    role: string,
  ) {
    const { oldPassword, newPassword } = authResetPasswordDto;
    // Get the old password of the user from salesforce
    const user = await this._getUser({ 
        Id: userId,
        Primary_Educational_Institution: programId,
        Record_Type_Name: role, 
      },
      {},
      instituteId,
    );
    if (!user) {
      throw new UnauthorizedException(Errors.INVALID_AUTH_TOKEN);
    }

    // Validate the password
    const cryptr = new Cryptr(EnvKeys.PASSWORD_HASHING_KEY);
    const decryptedPassword = cryptr.decrypt(user.Palette_Key);
    
    this.logger.log(`REC : ${oldPassword} ${newPassword}`);
    this.logger.log(`OLD : ${decryptedPassword}`);
    if (oldPassword !== decryptedPassword) {
      throw new UnauthorizedException(Errors.PASSWORDS_MISMATCH_ERROR);
    }

    // Encrypt the new password and update the user
    const newPasswordHash = cryptr.encrypt(newPassword);
    await this.sfService.generics.contacts.update(userId, 
      {
        Palette_Key: newPasswordHash,
      },
      instituteId,
    );

    // [TODO] Update password on firebase
    // [TODO] Send email to the user

    return {
      statusCode: 200,
      message: Responses.PASSWORD_RESET_SUCCESS,
    };
  }

  async forgotPassword(authForgotPasswordDto: AuthForgotPasswordDto, instituteId: string, programId: string, role: string) {
    const user = await this._getUser(
      {
        Palette_Email: authForgotPasswordDto.email,
        Primary_Educational_Institution: programId,
        Record_Type_Name: role, 
      },
      {},
      instituteId,
    );
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }
    
    if (user.IsRegisteredOnPalette === false) {
      throw new UnauthorizedException(Errors.NOT_REGISTERED_ERROR);
    }

    // Create an otp and send that to the user
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpMgr = new OtpManager();
    otpMgr.userId = user.Id;
    otpMgr.email = user.Palette_Email;
    otpMgr.otp = String(otp);
    otpMgr.for = OtpChecks.FORGOT_PASSWORD;
    await otpMgr.save();    

    // Send the otp to user via email and sms.
    this._notifier.send(NotificationType.SMS, {
      phoneNumber: user.Phone,
      body: `
      <#> ${otp} is your OTP for Palette. Valid only for ${
        process.env.PALETTE_OTP_RESET_TIME
      } minutes.
      ${this._generateHash(11)}
      `,
    });
    this._notifier.send(NotificationType.EMAIL, {
      to: user.Palette_Email,
      subject: '[!IMP] Palette Password Reset OTP',
      useTemplate: true,
      templateAttrs: {
        template: EmailTemplates.FORGOT_PASSWORD,
        context: {
          otp,
        },
      },
    });

    return {
      statusCode: 200,
      message: Responses.OTP_SENT_SUCCESS,
    };
  }
  
  async forgotPasswordValidateOtp(
    authForgotPasswordValidateOtpDto: AuthForgotPasswordValidateOtpDto,
    instituteId: string,
    programId: string,
    role: string,
  ) {
    const { email, otp } = authForgotPasswordValidateOtpDto;

    const userOtpMgr = await OtpManager.findOne({
      where: {
        email,
        for: OtpChecks.FORGOT_PASSWORD,
      }
    });
    if (!userOtpMgr) {
      throw new UnauthorizedException(Errors.MALFORMED_REQUEST);
    }

    // FOR DEV PURPOSE ONLY
    const DEFAULT_DEV_TEST_OTP = '345901';
    if (otp !== DEFAULT_DEV_TEST_OTP) {
      if (!(await userOtpMgr.validateOtp(otp))) {
        throw new UnauthorizedException(Errors.INVALID_OTP);
      }
    }

    const isOtpExpired =
      (new Date().getTime() - userOtpMgr.createdAt.getTime()) / 60000 <
      Number(process.env.PALETTE_OTP_RESET_TIME || 10);
    if (isOtpExpired) {
      throw new UnauthorizedException(Errors.OTP_EXPIRED);
    }

    const senderValidationId = uuid();
    userOtpMgr.senderValidationId = senderValidationId;
    await userOtpMgr.save();

    return {
      statusCode: 200,
      message: Responses.OTP_VALIDATION_SUCCESS,
      data: {
        senderValidationId,
      },
    };
  }

  // f3ea7f7a-9f63-4e9b-9568-58f98a2cb927
  async forgotPasswordSetNew(
    authForgotPasswordSetNewDto: AuthForgotPasswordSetNewDto,
    instituteId: string,
    programId: string, 
    role: string,
  ) {
    const { email, newPassword, senderValidationId } =
      authForgotPasswordSetNewDto;
    const user = await this._getUser({
        Palette_Email__c: email,
        Primary_Educational_Institution: programId,
        Record_Type_Name: role, 
      },
      {},
      instituteId
    );
    if (!user) {
      throw new UnauthorizedException(Errors.MALFORMED_REQUEST);
    }

    const userOtpMgr = await OtpManager.findOne({
      where: {
        email,
        for: OtpChecks.FORGOT_PASSWORD,
        senderValidationId
      },
    });
    if (!userOtpMgr) {
      throw new UnauthorizedException(Errors.MALFORMED_REQUEST);
    }

    const cryptr = new Cryptr(EnvKeys.PASSWORD_HASHING_KEY);
    const newPasswordHash = cryptr.encrypt(newPassword);
    await this.sfService.generics.contacts.update(user.Id, {
        Palette_Key: newPasswordHash,
      }, 
      instituteId
    );

    return {
      statusCode: 200,
      message: Responses.PASSWORD_RESET_SUCCESS,
    };
  }

  async sendMail() {
    this._notifier.send(NotificationType.EMAIL, {
      to: 'shaiqkar@gmail.com',
      subject: '[!IMP] Palette Password Reset OTP',
      body: 'Hello this is a test email',
    });
  }


  async getMultiplePrograms(instituteId: string): Promise<any> {
    let EDUCATIONAL_INSTITUTION = AccountRecordType.EDUCATIONAL_INSTITUTION;
    const programs = await this.sfService.models.accounts.get('Id, Account_Name, program_logo', { Record_Type_Name: EDUCATIONAL_INSTITUTION }, {}, instituteId);

    // console.log('programs', programs);
    const institutePrograms = [];
    programs.map(program => {
      const programObj = {};
      programObj['Id'] = program.Id;
      programObj['Name'] = program.Account_Name;
      programObj['Logo'] = program.program_logo;
      institutePrograms.push(programObj);
    });
    
    return { 
      statusCode: 200, 
      message: 'Programs fetched successfully', 
      data: institutePrograms,
    };
  }

  async getProgramRoles(instituteId: string): Promise<any> {
    const Roles = [
      Role.Administrator, 
      Role.Advisor, 
      Role.Faculty, 
      Role.Observer, 
      Role.Parent, 
      Role.Student
    ];
  
    return { 
      statusCode: 200, 
      message: 'Programs roles fetched successfully', 
      data: Roles,
    };
  }

  async getProgramOpportunities(instituteId: string, programId: string, role: string) {
    // console.log('instituteId', instituteId);
    // console.log('programId', programId);
    // console.log('role', role);
    
    // const acc = await this.sfService.models.accounts.get('Id, Account_Name', { Program__c: programId }, {}, instituteId);
    
    // return { 
    //   statusCode: 200, 
    //   message: 'Programs opportunities fetched successfully', 
    //   data: acc,
    // };
  }
}
