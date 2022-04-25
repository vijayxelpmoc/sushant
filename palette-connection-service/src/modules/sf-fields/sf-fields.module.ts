import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SFFieldsController } from './sf-fields.controller';
import { SFFieldEntity } from './sf-field.entity';
import { SFFieldsService } from './sf-fields.service';

@Module({
  imports: [TypeOrmModule.forFeature([SFFieldEntity])],
  controllers: [SFFieldsController],
  providers: [SFFieldsService],
  exports: [SFFieldsService],
})
export class SFFieldsModule {}
