import { Module } from '@nestjs/common';

import { ExecutorService } from './executor.service';

import { SFCredentialsModule } from '@src/modules/sf-credentials/sf-credentials.module';
import { SFModelsModule } from '@src/modules/sf-models/sf-models.module';
import { SFFieldsModule } from '@src/modules/sf-fields/sf-fields.module';
import { DataProcessorModule } from '@src/modules/data-processor/data-processor.module';
import { ExecutorController } from './executor.controller';

@Module({
  imports: [
    SFCredentialsModule,
    SFModelsModule,
    SFFieldsModule,
    DataProcessorModule,
  ],
  providers: [ExecutorService],
  exports: [ExecutorService],
  controllers: [ExecutorController],
})
export class ExecutorModule {}
