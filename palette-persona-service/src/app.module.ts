import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { WrapperModule } from '@gowebknot/palette-wrapper';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { ObserverModule } from './modules/observer/observer.module';
import { ParentModule } from './modules/parent/parent.module';
import { StudentModule } from './modules/student/student.module';
import { AdvisorModule } from './modules/advisor/advisor.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { SfService, CachingService } from '@gowebknot/palette-salesforce-service';
import { SfModule } from '@gowebknot/palette-salesforce-service/lib/sf.module';
import { SfmodelsModule } from '@gowebknot/palette-salesforce-service/lib/sfmodels/sfmodels.module';
import { SfcredentialsModule } from '@gowebknot/palette-salesforce-service/lib/sfcredentials/sfcredentials.module';
import { SffieldsModule } from '@gowebknot/palette-salesforce-service/lib/sffields/sffields.module';

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
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Admin@123',
      database: 'palettedb',
      autoLoadEntities: true,
      synchronize: true,
      // keepConnectionAlive: true,
    }),
    CacheModule.register({ ttl: 120, max: 30 }),
    WrapperModule,
    AdminModule,
    ObserverModule,
    ParentModule,
    StudentModule,
    AdvisorModule,
    SfModule,
    SfcredentialsModule,
    SffieldsModule,
    SfmodelsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SfService, CachingService],
})
export class AppModule {}


// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import Joi from 'joi';
// import { WrapperModule } from '@gowebknot/palette-wrapper';

// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AdminModule } from './modules/admin/admin.module';
// import { ObserverModule } from './modules/observer/observer.module';
// import { ParentModule } from './modules/parent/parent.module';
// import { StudentModule } from './modules/student/student.module';
// import { AdvisorModule } from './modules/advisor/advisor.module';
// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//       validationSchema: Joi.object({
//         NODE_ENV: Joi.string()
//           .valid('development', 'production')
//           .default('development'),
//         PORT: Joi.number().default(3000),
//       }),
//       envFilePath: '.env',
//     }),
//     WrapperModule,
//     AdminModule,
//     ObserverModule,
//     ParentModule,
//     StudentModule,
//     AdvisorModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}