import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// import { User } from './user.entity';
import { SfModule } from '@gowebknot/palette-salesforce-service/lib/sf.module';
import { SfmodelsModule } from '@gowebknot/palette-salesforce-service/lib/sfmodels/sfmodels.module';
import { SfcredentialsModule } from '@gowebknot/palette-salesforce-service/lib/sfcredentials/sfcredentials.module';
import { SffieldsModule } from '@gowebknot/palette-salesforce-service/lib/sffields/sffields.module';

@Module({
  // imports: [TypeOrmModule.forFeature([User])],
  imports: [
    SfModule,
    SfcredentialsModule,
    SffieldsModule,
    SfmodelsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
