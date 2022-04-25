import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SFCredentialsController } from './sf-credentials.controller';
import { SFCredentialEntity } from './sf-credential.entity';
import { SFCredentialsService } from './sf-credentials.service';

@Module({
  imports: [TypeOrmModule.forFeature([SFCredentialEntity])],
  controllers: [SFCredentialsController],
  providers: [SFCredentialsService],
  exports: [SFCredentialsService],
})
export class SFCredentialsModule {}
