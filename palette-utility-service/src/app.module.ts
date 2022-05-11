import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { WrapperModule } from '@gowebknot/palette-wrapper';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilityModule } from './modules/utility/utility.module';
import { SfModule } from '@gowebknot/palette-salesforce-service';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
      envFilePath: '.env',
    }),
    WrapperModule,
    SfModule.forRoot(),
    UtilityModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
