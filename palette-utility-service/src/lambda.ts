// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

import { preBuildApp } from './main';
import { AppModule } from './app.module';

let server: Handler;

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
  // check the event
  
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
