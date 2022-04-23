import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpManager } from './entities/otpManager.entity';
import { SfModule } from '@gowebknot/palette-salesforce-service/lib/sf.module';
import { SfmodelsModule } from '@gowebknot/palette-salesforce-service/lib/sfmodels/sfmodels.module';
import { SfcredentialsModule } from '@gowebknot/palette-salesforce-service/lib/sfcredentials/sfcredentials.module';
import { SffieldsModule } from '@gowebknot/palette-salesforce-service/lib/sffields/sffields.module';

@Module({
  imports: [
    JwtModule.register({}), 
    TypeOrmModule.forFeature([OtpManager]),
    SfModule,
    SfcredentialsModule,
    SffieldsModule,
    SfmodelsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
