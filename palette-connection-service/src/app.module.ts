import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SFCredentialsModule } from './modules/sf-credentials/sf-credentials.module';
import { SFModelsModule } from './modules/sf-models/sf-models.module';
import { SFFieldsModule } from './modules/sf-fields/sf-fields.module';
import { DataProcessorModule } from './modules/data-processor/data-processor.module';
import { ExecutorModule } from './modules/executor/executor.module';
import { SfModule } from '@gowebknot/palette-salesforce-service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        synchronize: configService.get<boolean>('DB_SYNC'),
        autoLoadEntities: true,
        keepConnectionAlive: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    DataProcessorModule,
    SFCredentialsModule,
    SFModelsModule,
    SFFieldsModule,
    ExecutorModule,
    // SfModule.forRoot(),
  ],
})
export class AppModule {}
