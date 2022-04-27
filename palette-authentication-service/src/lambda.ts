// tslint:disable-next-line:no-var-requires
require('module-alias/register');

// import serverlessExpress from '@vendia/serverless-express';
// import { Callback, Context, Handler } from 'aws-lambda';

// import { preBuildApp } from './main';

// let server: Handler;

// async function bootstrap() {
//   const app = await preBuildApp();
//   await app.init();
//   const expressApp = app.getHttpAdapter().getInstance();
//   return serverlessExpress({ app: expressApp });
// }

// export const handler: Handler = async (
//   event: any,
//   context: Context,
//   callback: Callback,
// ) => {
//   server = server ?? (await bootstrap());
//   return server(event, context, callback);
// };

import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Request, Response, NextFunction, Express } from 'express';
import express from 'express';
import * as serverlessExpress from 'aws-serverless-express';
import { Server } from 'http';

import { AppModule } from './app.module';
import { APIGatewayEvent, Context } from 'aws-lambda';

let lambdaProxy: Server;

async function bootstrap() {
  const expressServer: Express = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
  );

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
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();
  return serverlessExpress.createServer(expressServer, null, []);
}

bootstrap().then((server) => (lambdaProxy = server));

function waitForServer(event: any, context: any) {
  setImmediate(() => {
    if (!lambdaProxy) {
      waitForServer(event, context);
    } else {
      serverlessExpress.proxy(lambdaProxy, event, context);
    }
  });
}

export const handler = (event: APIGatewayEvent, context: Context) => {
  if (lambdaProxy) {
    serverlessExpress.proxy(lambdaProxy, event, context as any);
  } else {
    waitForServer(event, context);
  }
};


























// // tslint:disable-next-line:no-var-requires
// require('module-alias/register');

// import serverlessExpress from '@vendia/serverless-express';
// import { Callback, Context, Handler } from 'aws-lambda';

// import { preBuildApp } from './main';

// let server: Handler;

// async function bootstrap() {
//   const app = await preBuildApp();
//   await app.init();
//   const expressApp = app.getHttpAdapter().getInstance();
//   return serverlessExpress({ app: expressApp });
// }

// export const handler: Handler = async (
//   event: any,
//   context: Context,
//   callback: Callback,
// ) => {
//   server = server ?? (await bootstrap());
//   return server(event, context, callback);
// };
