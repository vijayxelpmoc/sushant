import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';

import { WrapperModule } from '@gowebknot/palette-wrapper';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
// import { SfModule } from '@gowebknot/palette-salesforce-service/lib/sf.module';
// import { SfmodelsModule } from '@gowebknot/palette-salesforce-service/lib/sfmodels/sfmodels.module';
// import { SfcredentialsModule } from '@gowebknot/palette-salesforce-service/lib/sfcredentials/sfcredentials.module';
// import { SffieldsModule } from '@gowebknot/palette-salesforce-service/lib/sffields/sffields.module';

// sls start offline
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
    UsersModule,
    AuthModule,
    // TypeOrmModule.forRoot({
    //   type: process.env.DB_TYPE as any,
    //   host: process.env.DB_HOST,
    //   port: Number(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_NAME,
    //   autoLoadEntities: true,
    //   synchronize: Boolean(process.env.DB_SYNC) || false,
    // }),
    // SfModule,
    // SfcredentialsModule,
    // SffieldsModule,
    // SfmodelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
