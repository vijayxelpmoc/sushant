import { Inject, Injectable, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get(key: string) {
    return await this.cache.get(key);
  }

  async set(key: string, value: unknown) {
    return await this.cache.set(key, value);
  }

  async delete(key: string) {
    return await this.cache.del(key);
  }
}
