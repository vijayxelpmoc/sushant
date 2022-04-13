import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Cryptr from 'cryptr';
import { v4 as uuid } from 'uuid';

import {
  SfService,
  SFField,
  Notifier,
  NotificationType,
  EmailTemplates,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
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

@Injectable()
export class AuthService {
  private _cryptr: Cryptr;
  private _notifier: Notifier;
  private readonly logger = new Logger(AuthService.name);

  constructor(private sfService: SfService, private jwtService: JwtService) {
    this._cryptr = new Cryptr(process.env.PASSWORD_HASHING_KEY);
    this._notifier = new Notifier();
  }

  // Util Methods

  async _generateJwtToken(user: User) {
    const payload = {
      id: user.Id,
      recordTypeName: user.Record_Type_Name__c,
      name: user.Name,
      email: user.Palette_Email__c,
      isRegisteredOnPalette: user.IsRegisteredOnPalette__c,
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

  async _getUser(identifier: SFField): Promise<User> {
    const _userFields =
      'Id, Palette_Email__c, Name, RecordTypeId, Phone, IsRegisteredOnPalette__c, Palette_Key__c, Record_Type_Name__c, prod_uuid__c, dev_uuid__c, Is_Deactive__c';

    const user: User = (
      await this.sfService.generics.contacts.get(_userFields, identifier)
    )[0];
    return user;
  }

  // Service Methods

  async validateUser(authValidateDto: AuthValidateDto) {
    const user = await this._getUser({
      Palette_Email__c: authValidateDto.email,
    });
    if (!user) {
      throw new NotFoundException(Errors.USER_NOT_FOUND);
    }

    const preRegistered =
      user.Palette_Key__c !== null || user.IsRegisteredOnPalette__c;

    return {
      statusCode: 200,
      message: preRegistered
        ? Responses.USER_REGISTERED_SUCCESS
        : Responses.USERS_FOUND_SUCCESS,
      data: {
        role: user.Record_Type_Name__c,
      },
    };
  }

  async login(authLoginDto: AuthLoginDto) {
    this.logger.log('NEW login Request');

    const user = await this._getUser({ Palette_Email__c: authLoginDto.email });
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }

    // Validate the password
    // [INFO] The monolith implementation of Palette uses Cryptr for hashing,
    // hence to keep the auth working for old users, cryptr is being used here
    // instead of bcrypt.
    if (authLoginDto.password !== this._cryptr.decrypt(user.Palette_Key__c)) {
      throw new UnauthorizedException(Errors.INVALID_PASSWORD);
    }

    // Check if user is pre registered
    if (user.IsRegisteredOnPalette__c === false) {
      throw new UnauthorizedException(Errors.NOT_REGISTERED_ERROR);
    }

    // Check if account is active
    if (user.Is_Deactive__c === true) {
      throw new UnauthorizedException(Errors.ACCOUNT_SUSPENDED);
    }

    const uuid =
      process.env.NODE_ENV === 'production'
        ? user.prod_uuid__c
        : user.dev_uuid__c;

    return {
      statusCode: 200,
      message: Responses.LOGIN_SUCCESS,
      data: {
        id: user.Id,
        role: user.Record_Type_Name__c,
        uuid,
        tokens: { ...(await this._generateJwtToken(user)) },
      },
    };
  }

  async resetPassword(
    authResetPasswordDto: AuthResetPasswordDto,
    userId: string,
  ) {
    const { oldPassword, newPassword } = authResetPasswordDto;
    // Get the old password of the user from salesforce
    const user = await this._getUser({ Id: userId });
    if (!user) {
      throw new UnauthorizedException(Errors.INVALID_AUTH_TOKEN);
    }

    // Validate the password
    this.logger.log(`REC : ${oldPassword} ${newPassword}`);
    this.logger.log(`OLD : ${this._cryptr.decrypt(user.Palette_Key__c)}`);
    if (oldPassword !== this._cryptr.decrypt(user.Palette_Key__c)) {
      throw new UnauthorizedException(Errors.PASSWORDS_MISMATCH_ERROR);
    }

    // Encrypt the new password and update the user
    const newPasswordHash = this._cryptr.encrypt(newPassword);
    await this.sfService.generics.contacts.update(userId, {
      Palette_Key__c: newPasswordHash,
    });

    // [TODO] Update password on firebase
    // [TODO] Send email to the user

    return {
      statusCode: 200,
      message: Responses.PASSWORD_RESET_SUCCESS,
    };
  }

  async forgotPassword(authForgotPasswordDto: AuthForgotPasswordDto) {
    const user = await this._getUser({
      Palette_Email__c: authForgotPasswordDto.email,
    });
    if (!user) {
      throw new UnauthorizedException(Errors.EMAIL_ADDRESS_NOT_FOUND);
    }

    if (user.IsRegisteredOnPalette__c === false) {
      throw new UnauthorizedException(Errors.NOT_REGISTERED_ERROR);
    }

    // Create an otp and send that to the user
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpMgr = new OtpManager();
    otpMgr.userId = user.Id;
    otpMgr.email = user.Palette_Email__c;
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
      to: user.Palette_Email__c,
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
  ) {
    const { email, otp } = authForgotPasswordValidateOtpDto;

    const userOtpMgr = await OtpManager.findOne({
      email,
      for: OtpChecks.FORGOT_PASSWORD,
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

  async forgotPasswordSetNew(
    authForgotPasswordSetNewDto: AuthForgotPasswordSetNewDto,
  ) {
    const { email, newPassword, senderValidationId } =
      authForgotPasswordSetNewDto;
    const user = await this._getUser({
      Palette_Email__c: email,
    });
    if (!user) {
      throw new UnauthorizedException(Errors.MALFORMED_REQUEST);
    }

    const userOtpMgr = await OtpManager.findOne({
      email,
      for: OtpChecks.FORGOT_PASSWORD,
      senderValidationId,
    });
    if (!userOtpMgr) {
      throw new UnauthorizedException(Errors.MALFORMED_REQUEST);
    }

    const newPasswordHash = this._cryptr.encrypt(newPassword);
    await this.sfService.generics.contacts.update(user.Id, {
      Palette_Key__c: newPasswordHash,
    });

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
}
