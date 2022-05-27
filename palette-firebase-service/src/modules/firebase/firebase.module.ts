import { Module } from '@nestjs/common';
import { FirebaseController } from './firebase.controller';
import { RawEventExecutor } from './services/firebase-sqs-processor.service';
import { FirebaseService } from './services/firebase.service';

@Module({
  imports: [],
  controllers: [FirebaseController],
  providers: [FirebaseService, 
    // FirebaseChatBackupService, 
    RawEventExecutor],
  exports: [FirebaseService],
})
export class FirebaseModule {}
