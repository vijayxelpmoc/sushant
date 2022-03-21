import { SQSRecord } from 'aws-lambda';

import {
  ProcessedRecord,
  NotificationType,
  FailedRecord,
  NotificationTypeEmail,
  NotificationTypeSMS,
  NotificationTypePush,
} from '@src/types';
import { EmailNotifier, SMSNotifier, PushNotifier } from '@src/notifiers';
import { logger } from '@src/logger';

const _localFailedRecordsDump: FailedRecord[] = [];
const emailNotifier = new EmailNotifier();
const smsNotifier = new SMSNotifier();
const pushNotifier = new PushNotifier();

export const processNotificationQueue = async (records: SQSRecord[]) => {
  for (const record of records) {
    try {
      const message: ProcessedRecord = JSON.parse(record.body);
      logger.info(`Processing recored of type : ${message.type}`);
      switch (message.type) {
        case NotificationType.EMAIL:
          await emailNotifier.send(message.body as NotificationTypeEmail);
          break;
        case NotificationType.SMS:
          await smsNotifier.send(message.body as NotificationTypeSMS);
          break;
        case NotificationType.PUSH:
          await pushNotifier.send(message.body as NotificationTypePush);
          break;
        default:
          logger.warn('Unknown Notification Type');
      }
    } catch (err) {
      // We need to handle message failures. In case a message fails, it needs
      // to be removed from the queue.
      logger.warn(`Failed to process message: ${err}`);
      const { messageId, receiptHandle, eventSourceARN, awsRegion } = record;
      _localFailedRecordsDump.push({
        messageId,
        receiptHandle,
        eventSourceARN,
        awsRegion,
      });
    }
  }
  // [TODO] Remove failed messages from the queue
};
