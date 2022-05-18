import { Body, Controller, Post, Patch, Req, UseGuards, Query, Get, Param } from '@nestjs/common';
import { FirebaseService } from './services/firebase.service';
import { FirebaseChatBackupService } from './services/firebase-chat-backup.service';

@Controller({
  path: 'firebase',
})
export class FirebaseController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly firebaseChatBackupService: FirebaseChatBackupService,
  ) {}

  // [TODO] - Add necessary firebase API's Here
}
