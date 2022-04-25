// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

import { ExecutorService } from './modules/executor/executor.service';
import { preBuildApp } from './main';
import { ExecutorCall } from './modules/executor/types';
import { AppModule } from './app.module';

let server: Handler;
let appContext: INestApplicationContext;

async function getAppContext() {
  if (!appContext) {
    appContext = await NestFactory.createApplicationContext(AppModule);
  }
  return appContext;
}

async function bootstrap() {
  const app = await preBuildApp();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  // Handle the executor events
  if (event.executor) {
    const callData: ExecutorCall = event.executor;
    const instance = await getAppContext();
    const contextId = ContextIdFactory.create();
    instance.registerRequestByContextId({ context }, contextId);
    const executor = await instance.resolve<ExecutorService>(
      ExecutorService,
      contextId,
    );
    return await executor.execute(callData);
  }

  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
