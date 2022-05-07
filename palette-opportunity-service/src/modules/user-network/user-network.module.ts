import { CacheModule, Module } from '@nestjs/common';
import { AdminService } from './services/adminservice.service';
import { AdvisorService } from './services/advisor.service';
import { ObserverService } from './services/observer.service';
import { ParentService } from './services/parent.service';
import { UserNetworkController } from './user-network.controller';
import { UserNetworkService } from './user-network.service';

@Module({
  controllers: [UserNetworkController],
  providers: [
    UserNetworkService,
    AdminService,
    ParentService,
    ObserverService,
    AdvisorService,
  ],
  exports: [UserNetworkService],
})
export class UserNetworkModule {}
