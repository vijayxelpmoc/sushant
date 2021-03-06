// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(3000);
// }
// bootstrap();



// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
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
 */
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

return app;
}

async function bootstrap() {
  const app = await preBuildApp();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

