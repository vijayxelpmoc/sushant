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
  async validate(
    @Body() authValidateDto: AuthValidateDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.validateUser(authValidateDto, instituteId);
  }

  @Post('login')
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
  async resetPassword(
    @Body() authResetPasswordDto: AuthResetPasswordDto,
    @Req() req,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.resetPassword(authResetPasswordDto, req.user.id, instituteId);
  }

  @Post('password/forgot')
  async forgotPassword(
    @Body() authForgotPasswordDto: AuthForgotPasswordDto,
    @Body('instituteId') instituteId: string,
  ) {
    return this.authService.forgotPassword(authForgotPasswordDto, instituteId);
  }

  @Post('password/forgot/validate')
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
