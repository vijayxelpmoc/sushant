import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { SfService } from '@gowebknot/palette-salesforce-service';

import {
  ChatMessage,
  ChatUser,
  ChatLogFile,
  ChatLogFileUrl,
  RoomType,
  MessageType,
  RoomSnapshot,
} from '../types';
import { ChatsLogsFS, Responses, Errors } from 'src/constants';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseChatBackupService {
  private _db: admin.firestore.Firestore;
  private _bucket: Bucket;
  private readonly _logger = new Logger(FirebaseChatBackupService.name);

  constructor(
    private sfService: SfService,
    private firebaseService: FirebaseService,
  ) {
    this._initFirebase();
  }

  private _initFirebase() {
    if (!this._db || !this._bucket) {
      admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        },
      );

      this._db = admin.firestore();
      this._bucket = admin.storage().bucket();
      this._logger.log('Firebase initialized');
    }
  }

  private _createPdf(content: string, path: string, password: string) {
    const doc = new PDFDocument({
      layout: 'landscape',
      userPassword: password,
    });
    doc.pipe(fs.createWriteStream(path));
    doc.fontSize(12).text(content);
    doc.save();
    doc.end();
  }

  private async _getRoomMessages(roomId: string) {
    const messagesDoc = await this._db
      .collection('rooms')
      .doc(roomId)
      .collection('messages')
      .get();

    const messages: ChatMessage[] = messagesDoc.docs.map((doc) => ({
      messageDocId: doc.id,
      messageDocData: (doc.id, ' => ', doc.data()),
    }));

    return messages;
  }

  private async _getAllUsers() {
    const usersDoc = await this._db.collection('users').get();
    const sfUsers = await this.firebaseService.getAllUuidRecords();

    const users = usersDoc.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          sfId: sfUsers.find((user) => user.sfId === doc.id).sfId || undefined,
        } as ChatUser),
    );

    return users;
  }

  private async _getRooms() {
    const roomsDoc = await this._db.collection('rooms').get();
    const users = await this._getAllUsers();

    const mappedRooms = roomsDoc.docs.map((doc) => ({
      id: doc.id,
      data: (doc.id, '=>', doc.data()),
    }));

    const rooms = mappedRooms.map(async (room) => {
      const messages = await this._getRoomMessages(room.id);
      return {
        room,
        messages,
      };
    });
    return {
      rooms,
      users,
    };
  }

  private async _getChatLog(roomSnapshot: RoomSnapshot[], users: ChatUser[]) {
    let chatLog = '';
    roomSnapshot.map((snap) => {
      let roomLog = '';

      //   Append Chat Type
      switch (snap.room.data.type) {
        case RoomType.DIRECT:
          roomLog += `\nChat: `;
          break;
        case RoomType.GROUP:
          roomLog += `\nGroup: ${snap.room.data.name}\nMembers: `;
          break;
      }

      //   Append Room Members
      snap.room.data.userIds.map((idx: string) => {
        const user = users.find((user) => user.sfId === idx);
        roomLog += `${user.firstName} ${user.lastName} `;
      });
      roomLog += `\n`;

      //   Append Messages
      snap.messages.map((message) => {
        let messageLog = '';
        const { timestamp, type, authorId } = message.messageDocData;
        const dateTime = new Date(timestamp._seconds * 1000)
          .toString()
          .split('(');
        messageLog += `[${dateTime}]  `;

        const author = users.find((user) => user.sfId === authorId);
        if (author) {
          messageLog += `${author.firstName} ${author.lastName}: `;
        }

        switch (type) {
          case MessageType.TEXT:
            messageLog += `"${message.messageDocData.text}"\n`;
            break;
          case MessageType.IMAGE:
            messageLog += `ImageName: "${message.messageDocData.imageName}", ImageURI: ${message.messageDocData.uri}\n`;
            break;
          case MessageType.FILE:
            messageLog += `FileName: "${message.messageDocData.fileName}", FileURI: ${message.messageDocData.uri}\n`;
            break;
        }
        roomLog += messageLog;
      });
      chatLog += roomLog + '\n';
    });
    return chatLog;
  }

  private async _getUsersPreviousDayChatLog(backupDestination: string) {
    const openRooms = await this._getRooms();
    const users = await Promise.all(openRooms.users);
    const rooms = await Promise.all(openRooms.rooms);
    const chatRooms: {
      [key: string]: RoomSnapshot[];
    } = {};
    const prevDayDate = new Date();
    prevDayDate.setDate(prevDayDate.getDate() - 1);

    rooms.forEach(async (room) => {
      // Filter messages based on previous day date
      room.messages = room.messages.filter((message) => {
        const { timestamp } = message.messageDocData;
        const dateTime = new Date(timestamp._seconds * 1000).toDateString();
        return dateTime === prevDayDate.toDateString();
      });
      //   Sort the messages in ascending order
      room.messages.sort(
        (first, second) =>
          first.messageDocData.timestamp - second.messageDocData.timestamp,
      );

      for (const user of room.room.data.userIds) {
        if (!chatRooms[user]) {
          chatRooms[user] = [];
        }
        chatRooms[user].push(room);
      }
    });

    const logFiles: ChatLogFile[] = [];
    users.forEach(async (user) => {
      const chatLog = await this._getChatLog(chatRooms[user.sfId], users);
      // If Chat Log is empty, skipping creating files
      if (chatLog !== '') {
        const fileName = `${user.firstName}_${user.lastName}_${user.sfId}.pdf`;
        const filePath = path.join(process.cwd(), ChatsLogsFS.FILE_DIR_NAME);
        try {
          fs.mkdirSync(filePath);
        } catch (error) {
          if (error.code !== 'EEXIST') {
            throw error;
          }
        }
        const filePathWithFileName = path.join(filePath, fileName);

        this._createPdf(
          chatLog,
          filePathWithFileName,
          process.env.FIREBASE_LOG_FILE_PASSWORD,
        );

        logFiles.push({
          name: fileName,
          localPath: filePathWithFileName,
          cloudDestination: `${backupDestination}/${fileName.slice(
            0,
            -4,
          )}/${prevDayDate.toDateString()}.pdf`,
          accessFileToken: uuidv4(),
          user,
        });
      }
    });

    return logFiles;
  }

  private async _uploadChatLogs(logFiles: ChatLogFile[]) {
    logFiles.forEach(async (file) => {
      await this._bucket
        .upload(file.localPath, {
          destination: file.cloudDestination,
          metadata: {
            contentType: 'application/pdf',
            cacheControl: 'public, max-age=31536000',
            metadata: {
              firebaseStorageDownloadTokens: file.accessFileToken,
            },
          },
        })
        .then(() => {
          this._logger.log(`Uploaded ${file.name} to ${file.cloudDestination}`);
        })
        .catch((error) => {
          this._logger.error(error);
        });
    });
  }

  private _getLogFilesLink(logFiles: ChatLogFile[]) {
    const baseUrl = process.env.FIREBASE_TOKEN_BASE_URL;
    const chatLogUrls: Promise<ChatLogFileUrl>[] = logFiles.map(
      async (file) => {
        return await this._bucket
          .getFiles({
            prefix: file.cloudDestination,
          })
          .then(() => ({
            user: file.user,
            url: `${baseUrl}/${encodeURI(file.cloudDestination).replace(
              /\//g,
              '%2F',
            )}?alt=media&token=${file.accessFileToken}`,
          }));
      },
    );
    return Promise.all(chatLogUrls);
  }

  private async _saveToSalesforce(logFilesUrls: ChatLogFileUrl[]) {
    const prevDayDate = new Date();
    prevDayDate.setDate(prevDayDate.getDate() - 1);
    const prevDay = prevDayDate.toDateString();

    logFilesUrls.forEach(async (file) => {
      if (!file.user.sfId) {
        this._logger.error(
          `User ${file.user.firstName} ${file.user.lastName} has no SF ID`,
        );
        return;
      }
      const chatName = `${file.user.firstName}_${file.user.lastName}_${prevDay}_ChatLog`;
      await this.sfService.models.documents.create({
        Contact__c: file.user.sfId,
        Document_Url__c: file.url,
        Name: chatName,
      });
      this._logger.log(`Saved chat log link to salesforce -  ${chatName}`);
    });
  }

  private async _runChatLogBackup() {
    try {
      const logFiles = await this._getUsersPreviousDayChatLog(
        ChatsLogsFS.DESTINATION,
      );
      await this._uploadChatLogs(logFiles);
      const logFilesUrls = await this._getLogFilesLink(logFiles);
      await this._saveToSalesforce(logFilesUrls);

      return {
        statusCode: 200,
        message: Responses.LOG_UPLOAD_SUCCESS,
        data: logFilesUrls,
      };
    } catch (error) {
      throw new InternalServerErrorException(Errors.LOG_UPLOAD_FAILED);
    }
  }

  //   This Cron Job will run everyday at 12:05 AM
  // TODO: Setup this corn as an event in lambda, else it won't work
  @Cron('05 0 * * *')
  async runChatLogBackupCronJob() {
    await this._runChatLogBackup();
  }
}
