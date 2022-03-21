export interface ChatMessage {
  messageDocId: string;
  messageDocData: any;
}

export interface ChatUser {
  firstName: string;
  lastName: string;
  sfId: string | undefined;
  avatarUrl?: any;
  fcmTokens?: any;
}

export interface ChatLogFile {
  name: string;
  localPath: string;
  cloudDestination: string;
  accessFileToken?: undefined | string;
  user: ChatUser;
}

export interface ChatLogFileUrl {
  user: ChatUser;
  url: string;
}

export interface Room {
  id: string;
  data: any;
}

export interface RoomSnapshot {
  room: Room;
  messages: ChatMessage[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

export enum RoomType {
  DIRECT = 'direct',
  GROUP = 'group',
}
