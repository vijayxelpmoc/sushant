import { Module } from '@nestjs/common';

import { FirebaseService } from './services/firebase.service';
import { FirebaseChatBackupService } from './services/firebase-chat-backup.service';
import { RawEventExecutor } from './services/firebase-sqs-processor.service';
import { FirebaseController } from './firebase.controller';

@Module({
  controllers: [FirebaseController],
  providers: [FirebaseService, FirebaseChatBackupService, RawEventExecutor],
})
export class FirebaseModule {}
