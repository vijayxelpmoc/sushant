import Twilio from 'twilio';

import { NotificationTypeSMS } from '@src/types';

export class SMSNotifier {
  private _client: Twilio.Twilio;
  constructor() {
    this._client = Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }
  async send(data: NotificationTypeSMS) {
    const numbers = Array.isArray(data.phoneNumber)
      ? data.phoneNumber
      : [data.phoneNumber];

    Promise.all(
      numbers.map((num) => {
        return this._client.messages.create({
          body: data.body,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: num,
        });
      }),
    ).catch((err) => console.error(`[SMS NOTIFIER] ${err}`));
  }
}
