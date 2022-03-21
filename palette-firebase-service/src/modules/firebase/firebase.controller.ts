import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FirebaseService } from './services/firebase.service';
import { FirebaseChatBackupService } from './services/firebase-chat-backup.service';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class FirebaseController {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly firebaseChatBackupService: FirebaseChatBackupService,
  ) {}

  // [TODO] - Add necessary firebase API's Here
}
