import { CacheModule, Module } from '@nestjs/common';
import { CachingService } from './caching.service';

@Module({
  imports: [CacheModule.register({ ttl: 120, max: 30 })],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
