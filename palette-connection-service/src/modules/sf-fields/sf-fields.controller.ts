import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateSFFieldDto } from './dto/create-sf-field.dto';
import { SFFieldEntity } from './sf-field.entity';
import { SFFieldsService } from './sf-fields.service';

@Controller({
  path: 'con/manager/sffields',
})
export class SFFieldsController {
  constructor(private sffieldsService: SFFieldsService) {}

  @Get()
  async get(): Promise<SFFieldEntity[]> {
    return await this.sffieldsService.get();
  }

  @Get('/:id')
  async getById(@Param('id') id: number): Promise<SFFieldEntity> {
    return await this.sffieldsService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateSFFieldDto[]): Promise<any> {
    return await this.sffieldsService.create(data);
  }

  @Patch('/:id')
  async update(
    @Param('id') id: number,
    @Body() data: Partial<CreateSFFieldDto>,
  ): Promise<any> {
    return await this.sffieldsService.update(id, data);
  }

  @Post('load')
  async load(): Promise<any> {
    return await this.sffieldsService.load();
  }
}
