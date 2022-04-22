import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateSFModelDto } from './dto/create-sf-model.dto';
import { SFModelEntity } from './sf-model.entity';
import { SFModelsService } from './sf-models.service';

@Controller({
  path: 'con/manager/sfmodels',
})
export class SFModelsController {
  constructor(private sfModelsService: SFModelsService) {}

  @Get()
  async getSFModels(): Promise<SFModelEntity[]> {
    return await this.sfModelsService.get();
  }

  @Get('/:id')
  async getById(@Param('id') id: number): Promise<SFModelEntity> {
    return await this.sfModelsService.getById(id);
  }

  @Post()
  async create(@Body() data: CreateSFModelDto[]): Promise<any> {
    return await this.sfModelsService.create(data);
  }

  @Patch('/:id')
  async update(
    @Param('id') id: number,
    @Body() data: Partial<CreateSFModelDto>,
  ): Promise<any> {
    return await this.sfModelsService.update(id, data);
  }

  @Post('load')
  async load(): Promise<any> {
    return await this.sfModelsService.load();
  }
}
