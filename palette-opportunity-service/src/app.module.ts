import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import {WrapperModule} from '@gowebknot/palette-wrapper';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpportunityModule } from './modules/opportunity/opportunity.module';
import { SfModule } from '@gowebknot/palette-salesforce-service';
import { UserNetworkModule } from './modules/user-network/user-network.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
      envFilePath: '.env',
    }),
    SfModule.forRoot(),
    WrapperModule,
    OpportunityModule,
    UserNetworkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
