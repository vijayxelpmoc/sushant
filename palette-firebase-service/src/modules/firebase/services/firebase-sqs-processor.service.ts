import { Injectable, Logger } from '@nestjs/common';

import { FirebaseService } from './firebase.service';

@Injectable()
export class RawEventExecutor {
  private readonly _logger: Logger;
  constructor(private firebaseService: FirebaseService) {
    this._logger = new Logger(RawEventExecutor.name);
  }

  execute(func: string, args: Array<any>) {
    if (this.firebaseService[func] === 'Function') {
      try {
        this.firebaseService[func](...args);
      } catch (error) {
        this._logger.error(
          `Unable to execute method ${func} on ${FirebaseService.name} with arguments - ${args}\n${error}`,
        );
      }
    }
  }

  // This method is implemented to log event errors in
  // the lambda handler.
  logError(error: string) {
    this._logger.error(error);
  }
}
