import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { WrapperModule } from '@gowebknot/palette-wrapper';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { ObserverModule } from './modules/observer/observer.module';
import { ParentModule } from './modules/parent/parent.module';
import { StudentModule } from './modules/student/student.module';
import { AdvisorModule } from './modules/advisor/advisor.module';

import {
  SfService,
  CachingService,
  SfModule,
} from '@gowebknot/palette-salesforce-service';

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
    SfModule.forRoot(),
    WrapperModule,
    AdminModule,
    ObserverModule,
    ParentModule,
    StudentModule,
    AdvisorModule,
  ],
  controllers: [AppController],
  providers: [AppService, SfService, CachingService],
})
export class AppModule {}
