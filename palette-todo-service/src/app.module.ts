import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { WrapperModule } from '@gowebknot/palette-wrapper';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TodoModule } from './modules/todo/todo.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { EventsModule } from './modules/events/events.module';

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
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
      envFilePath: ['.env'],
    }),
    SfModule.forRoot({ executorUrl: 'http://localhost:3001/' }),
    WrapperModule,
    TodoModule,
    ActivitiesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
