import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
} from '@nestjs/common';

import {
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
  Role,
} from '@gowebknot/palette-wrapper';
import { CachingService } from '@gowebknot/palette-salesforce-service';

import { ParentService } from './parent.service';

@Controller({
  path: 'parent',
})
export class ParentController {
  constructor(private parentService: ParentService) {}

  // @hasRoles(Role.Parent)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get('profile')
  // async getParent(@Request() req) {
  //   return await this.parentService.getParent(req.user.id);
  // }

  // @hasRoles(Role.Parent)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Patch('profile/update')
  // async updateParentProfile(
  //   @Request() req,
  //   // @Body() updateSfParentDto: UpdateSfParentDto,
  // ) {
  //   return await this.parentService.updateParentProfile(
  //     req.user.id,
  //     updateSfParentDto,
  //   );
  // }

  // @hasRoles(Role.Parent)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get('dependents/institutes')
  // async getAvailableInstitutes(@Request() req) {
  //   return await this.parentService.getDependentInstitutes(req.user.id);
  // }
}
