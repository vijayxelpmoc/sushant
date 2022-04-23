import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { hasRoles, JwtAuthGuard, RolesGuard, Role } from '@gowebknot/palette-wrapper';
import { CachingService } from '@gowebknot/palette-salesforce-service';
import { UpdateSfObserverDto } from './dtos';
import { ObserverService } from './observer.service';

@Controller({
  path: 'observer',
})
export class ObserverController {
  constructor(
    private observerService: ObserverService,
    private cachingService: CachingService,
  ) { }

  /** returns the observer profile details
   *  @param {Request} req access token and request
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Observer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    description: 'Fetched observer Data',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBearerAuth()
  @Get('profile')
  async getObserver(@Request() req) {
    return await this.observerService.getObserver(req.user.id);
  }

  /** updates observer profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the advisor profile data
   * @returns {Object} status code and message
   */
  @hasRoles(Role.Observer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    description: 'Observer Updated',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateSfObserverDto })
  @Patch('profile/update')
  update(@Request() req, @Body() updateSfObserverDto: UpdateSfObserverDto) {
    return this.observerService.update(req.user.id, updateSfObserverDto);
  }

  /**
   * Function to get all observer details by id
   * @param req ACCESS_TOKEN
   * returns observer details
   */
  @hasRoles(Role.Observer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({
    description: 'Observer Data',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBearerAuth()
  @Get('institute')
  async getObserverDetails(@Request() req) {
    const cacheKey = `${req.user.id}-observerDetails`;

    const cachedResponse = await this.cachingService.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await this.observerService.getObserverDetails(req.user.id);
    await this.cachingService.set(cacheKey, response);
    return response;
  }
}
