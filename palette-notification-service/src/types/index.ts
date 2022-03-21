export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum EmailTemplates {
  PASSWORD_RESET = 'PASSWORD_RESET',
}

interface KeyValue {
  [key: string]: string | number;
}

interface EmailTemplateAttrs {
  template: EmailTemplates;
  context: KeyValue;
}

export interface NotificationTypeEmail {
  to: string | string[];
  subject: string;
  coupled?: boolean;
  useTemplate?: boolean;
  body?: string;
  templateAttrs?: EmailTemplateAttrs;
}

export interface NotificationTypeSMS {
  phoneNumber: string | string[];
  body: string;
}

export interface NotificationTypePush {
  userId: string;
  title: string;
  notificationId: string;
}

export interface ProcessedRecord {
  id: string;
  timestamp: string;
  type: NotificationType;
  body: NotificationTypeEmail | NotificationTypeSMS | NotificationTypePush;
}

export interface FailedRecord {
  messageId: string;
  receiptHandle: string;
  eventSourceARN: string;
  awsRegion: string;
}

export interface PushNotificationPayload {
  id: string;
  timestamp: string;
  body: NotificationTypePush;
  caller: string;
}
