import AWS from 'aws-sdk';

import { NotificationTypePush, PushNotificationPayload } from '@src/types';

export class PushNotifier {
  _sqs: AWS.SQS;

  constructor() {
    AWS.config.update({
      region: process.env.AWS_DEFAULT_REGION || 'ap-southeast-2',
    });
    this._sqs = new AWS.SQS();
  }

  _SQS = async (payload: PushNotificationPayload) => {
    return this._sqs
      .sendMessage({
        QueueUrl: process.env.PALETTE_AWS_SQS_FIREBASE_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
      })
      .promise();
  };

  async send(data: NotificationTypePush) {
    console.log(`Data ${data}`);
  }
}
