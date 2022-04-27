import { Body, Controller, Post, Patch, Req, UseGuards, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
import { AuthService } from './auth.service';
import {
  AuthLoginDto,
  AuthResetPasswordDto,
  AuthForgotPasswordDto,
  AuthValidateDto,
  AuthForgotPasswordValidateOtpDto,
  AuthForgotPasswordSetNewDto,
} from './dto';

@ApiTags('auth')
@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @ApiOkResponse({ description: Responses.USER_REGISTERED_SUCCESS })
  @ApiOkResponse({ description: Responses.USERS_FOUND_SUCCESS })
  @ApiNotFoundResponse({ description: Errors.USER_NOT_FOUND })
  @ApiBody({ type: AuthValidateDto })
  async validate(
    @Body() authValidateDto: AuthValidateDto,
    @Body('instituteId') instituteId: string,
  ) {
    console.log('instituteId', instituteId);
    return this.authService.validateUser(authValidateDto, instituteId);
  }

  @Post('login')
  @ApiOkResponse({ description: Responses.LOGIN_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.EMAIL_ADDRESS_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: Errors.INVALID_PASSWORD })
  @ApiUnauthorizedResponse({ description: Errors.NOT_REGISTERED_ERROR })
  @ApiUnauthorizedResponse({ description: Errors.ACCOUNT_SUSPENDED })
  @ApiBody({ type: AuthLoginDto })
  async login(
    @Body() authLoginDto: AuthLoginDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.login(authLoginDto, instituteId);
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
    Role.Observer,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('password/reset')
  @ApiOkResponse({ description: Responses.PASSWORD_RESET_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.INVALID_AUTH_TOKEN })
  @ApiUnauthorizedResponse({ description: Errors.PASSWORDS_MISMATCH_ERROR })
  @ApiBody({ type: AuthResetPasswordDto })
  async resetPassword(
    @Body() authResetPasswordDto: AuthResetPasswordDto,
    @Req() req,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.resetPassword(authResetPasswordDto, req.user.id, instituteId);
  }

  @Post('password/forgot')
  @ApiOkResponse({ description: Responses.OTP_SENT_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.EMAIL_ADDRESS_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: Errors.NOT_REGISTERED_ERROR })
  @ApiBody({ type: AuthForgotPasswordDto })
  async forgotPassword(
    @Body() authForgotPasswordDto: AuthForgotPasswordDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.forgotPassword(authForgotPasswordDto, instituteId);
  }

  @Post('password/forgot/validate')
  @ApiOkResponse({ description: Responses.OTP_VALIDATION_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.MALFORMED_REQUEST })
  @ApiUnauthorizedResponse({ description: Errors.INVALID_OTP })
  @ApiUnauthorizedResponse({ description: Errors.OTP_EXPIRED })
  @ApiBody({ type: AuthForgotPasswordValidateOtpDto })
  async forgotPasswordValidate(
    @Body() authForgotPasswordValidateOtpDto: AuthForgotPasswordValidateOtpDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.forgotPasswordValidateOtp(
      authForgotPasswordValidateOtpDto, 
      instituteId,
    );
  }

  @Post('password/forgot/set')
  @ApiOkResponse({ description: Responses.PASSWORD_RESET_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.MALFORMED_REQUEST })
  @ApiBody({ type: AuthForgotPasswordSetNewDto })
  async forgotPasswordSet(
    @Body() authForgotPasswordSetNewDto: AuthForgotPasswordSetNewDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.forgotPasswordSetNew(authForgotPasswordSetNewDto, instituteId);
  }

  @Post('send')
  async send() {
    this.authService.sendMail();
  }
}
