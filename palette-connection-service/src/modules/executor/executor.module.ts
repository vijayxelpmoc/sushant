import { Module } from '@nestjs/common';

import { ExecutorService } from './executor.service';

import { SFCredentialsModule } from '../sf-credentials/sf-credentials.module';
import { SFModelsModule } from '../sf-models/sf-models.module';
import { SFFieldsModule } from '../sf-fields/sf-fields.module';

@Module({
  imports: [SFCredentialsModule, SFModelsModule, SFFieldsModule],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
