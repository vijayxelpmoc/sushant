import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SFCredentialsController } from './sf-credentials.controller';
import { SFCredentialEntity } from './sf-credential.entity';
import { SFCredentialsService } from './sf-credentials.service';
import { SFFieldsModule } from '../sf-fields/sf-fields.module';
import { SFModelsModule } from '../sf-models/sf-models.module';
import { ExecutorModule } from '../executor/executor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SFCredentialEntity]), 
    SFFieldsModule, 
    SFModelsModule,
    forwardRef(() => ExecutorModule), 
  ],
  controllers: [SFCredentialsController],
  providers: [SFCredentialsService],
  exports: [SFCredentialsService],
})
export class SFCredentialsModule {}
