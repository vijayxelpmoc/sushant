import { Req, Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
} from '@gowebknot/palette-wrapper';

import { Errors, Responses } from '@src/constants';
import { UsersService } from './users.service';
import { PreRegisterUserDto, AddProfilePictureDto } from './dto';

@ApiTags('users')
@Controller({
  path: 'users',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register/pre')
  async preRegister(
    @Body() preRegisterUserDto: PreRegisterUserDto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return this.usersService.preRegisterForPalette(preRegisterUserDto, instituteId, programId);
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
  @Post('profile/add/picture')
  async addProfilePicture(
    @Body() addProfilePictureDto: AddProfilePictureDto,
    @Req() req,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.addProfilePicture(
      addProfilePictureDto,
      req.user.id,
      instituteId,
      programId,
      role,
    );
  }
}
