import { Inject, Injectable, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getKey(keyName: string) {
    return await await this.cacheManager.get(`${keyName}`);
  }

  async setKey(keyName: string, value: any) {
    return await this.cacheManager.set(keyName, value);
  }
}
