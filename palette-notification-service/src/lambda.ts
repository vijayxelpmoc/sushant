// tslint:disable-next-line:no-var-requires
require('module-alias/register');

import { Context, SQSHandler, SQSEvent } from 'aws-lambda';

import { processNotificationQueue } from './processor';
import { logger } from './logger';

export const handler: SQSHandler = async (
  event: SQSEvent,
  context: Context,
) => {
  logger.info(`Received new event : ${JSON.stringify(event.Records)}`);
  processNotificationQueue(event.Records);
};
