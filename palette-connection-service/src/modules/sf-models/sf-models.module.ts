import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SFModelsController } from './sf-models.controller';
import { SFModelEntity } from './sf-model.entity';
import { SFModelsService } from './sf-models.service';

@Module({
  imports: [TypeOrmModule.forFeature([SFModelEntity])],
  controllers: [SFModelsController],
  providers: [SFModelsService],
  exports: [SFModelsService],
})
export class SFModelsModule {}
