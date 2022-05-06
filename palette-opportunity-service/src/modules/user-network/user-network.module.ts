import { CacheModule, Module } from '@nestjs/common';
import { UserNetworkController } from './user-network.controller';
import { UserNetworkService } from './user-network.service';

@Module({
  controllers: [UserNetworkController],
  providers: [UserNetworkService],
  exports: [UserNetworkService],
})
export class UserNetworkModule {}
