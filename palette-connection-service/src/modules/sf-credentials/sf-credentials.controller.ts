import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateSFCredentialDto } from './dto/create-sf-credential.dto';
import { SFCredentialEntity } from './sf-credential.entity';
import { SFCredentialsService } from './sf-credentials.service';

@Controller({
  path: 'con/manager/sfcredentials',
})
export class SFCredentialsController {
  constructor(private sfCredentialsService: SFCredentialsService) {}

  @Get()
  async get(): Promise<SFCredentialEntity[]> {
    return await this.sfCredentialsService.get();
  }

  @Get('/:id')
  async getById(@Param('id') id: number): Promise<SFCredentialEntity> {
    return await this.sfCredentialsService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateSFCredentialDto[]): Promise<any> {
    return await this.sfCredentialsService.create(data);
  }

  @Patch('/:id')
  async update(
    @Param('id') id: number,
    @Body() data: Partial<CreateSFCredentialDto>,
  ): Promise<SFCredentialEntity> {
    return await this.sfCredentialsService.update(id, data);
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.sfCredentialsService.delete(id);
  }

  @Post('load')
  async load(): Promise<any> {
    return await this.sfCredentialsService.load();
  }
}
