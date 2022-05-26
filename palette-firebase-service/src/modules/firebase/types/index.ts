import { KeyValue } from '@gowebknot/palette-salesforce-service';

export interface Contact {
  sfId: string;
  email: string;
  uuid: string;
}

export interface SFContact {
  Id: string;
  Name: string;
  prod_uuid__c: string;
  dev_uuid__c: string;
  Email: string;
}

export enum FirebaseSQSEvent {
  EXECUTOR_CALL = 'EXECUTOR_CALL',
}

export interface ProcessedFirebaseRecord {
  id: string;
  timestamp: string;
  type: FirebaseSQSEvent;
  executorFunction: string;
  args: Array<any>;
}

export interface FirestoreUser {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  fcmTokens?: string[];
}

export interface PushNotificationData { 
  type: string;
  data: KeyValue | string | number;
}

export * from './firebase-chat-backup.interface';
