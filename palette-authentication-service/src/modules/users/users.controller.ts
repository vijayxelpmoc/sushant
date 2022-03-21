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
  // version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register/pre')
  @ApiOkResponse({ description: Responses.PRE_REGISTER_SUCCESS })
  @ApiUnauthorizedResponse({ description: Errors.EMAIL_ADDRESS_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: Errors.PRE_REGISTERED_ERROR })
  @ApiForbiddenResponse({ description: Errors.FERPA_NOT_ACCEPTED })
  @ApiBody({ type: PreRegisterUserDto })
  preRegister(@Body() preRegisterUserDto: PreRegisterUserDto) {
    return this.usersService.preRegisterForPalette(preRegisterUserDto);
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
  @ApiOkResponse({ description: Responses.ADD_PROFILE_PICTURE_SUCCESS })
  @ApiBody({ type: AddProfilePictureDto })
  addProfilePicture(
    @Body() addProfilePictureDto: AddProfilePictureDto,
    @Req() req,
  ) {
    return this.usersService.addProfilePicture(
      addProfilePictureDto,
      req.user.id,
    );
  }
}
