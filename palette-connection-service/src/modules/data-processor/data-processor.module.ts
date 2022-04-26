import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

import { SFCredentialsModule } from '@src/modules/sf-credentials/sf-credentials.module';
import { SFModelsModule } from '@src/modules/sf-models/sf-models.module';
import { SFFieldsModule } from '@src/modules/sf-fields/sf-fields.module';
import { DataProcessorService } from './data-processor.service';
import { CachingService } from './caching.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('PALETTE_REDIS_HOST'),
        port: configService.get<number>('PALETTE_REDIS_PORT'),
        ttl: configService.get<number>('CACHE_TTL'),
      }),
    }),
    SFCredentialsModule,
    SFModelsModule,
    SFFieldsModule,
  ],
  providers: [DataProcessorService, CachingService],
  exports: [DataProcessorService, CachingService],
})
export class DataProcessorModule {}
