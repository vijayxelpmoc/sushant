// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

import { AppModule } from './app.module';

export async function preBuildApp() {
  const app = await NestFactory.create(AppModule);

  /*
   * Middleware configuration
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
  });

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });

  /*
   * Using validation pipe enables us to use class-validator to validate
   * the request body, entity input.
   */
  app.useGlobalPipes(new ValidationPipe());

  /*
   * Enable serialization globally. This is required for proper serialization of nested
   * objects in the response body. Example, removing password from the response.
   * Class Transformer class can be used to acheive this.
   */
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  return app;
}

async function bootstrap() {
  const app = await preBuildApp();

  /*
   * Setup swagger only for dev, won't work as lambda
   */
  const config = new DocumentBuilder()
    .setTitle('Palette')
    .setDescription('Palette Auth and User Management')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
