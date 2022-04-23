import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpManager } from './entities/otpManager.entity';

@Module({
  imports: [
    JwtModule.register({}), 
    TypeOrmModule.forFeature([OtpManager]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
