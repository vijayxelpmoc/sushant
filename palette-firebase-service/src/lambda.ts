// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler, SQSEvent, SQSRecord } from 'aws-lambda';

import {
  ProcessedFirebaseRecord,
  FirebaseSQSEvent,
} from './modules/firebase/types';
import { preBuildApp } from './main';
import { RawEventExecutor } from './modules/firebase/services/firebase-sqs-processor.service';
import { AppModule } from './app.module';

let server: Handler;
let appContext: INestApplicationContext;

async function bootstrap() {
  const app = await preBuildApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

async function bootstrapContext() {
  if (!appContext) {
    appContext = await NestFactory.createApplicationContext(AppModule);
  }
  return appContext;
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());

  // Process SQS Events Here.
  const instance = await bootstrapContext();
  const contextId = ContextIdFactory.create();
  instance.registerRequestByContextId({ context }, contextId);
  const executor = await instance.resolve<RawEventExecutor>(
    RawEventExecutor,
    contextId,
  );
  const sqsRecords: SQSRecord[] = (event as SQSEvent).Records;
  if (sqsRecords) {
    for (const record of sqsRecords) {
      try {
        const processedRecord: ProcessedFirebaseRecord = JSON.parse(
          record.body,
        );
        if (processedRecord.type === FirebaseSQSEvent.EXECUTOR_CALL) {
          const { executorFunction, args } = processedRecord;
          executor.execute(executorFunction, args);
        }
      } catch (error) {
        executor.logError(
          `Error in processing Firebase SQS Function Executor event : ${error}`,
        );
      }
    }
  }

  return server(event, context, callback);
};
