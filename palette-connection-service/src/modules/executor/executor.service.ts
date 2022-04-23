import { Injectable, Logger, BadRequestException } from '@nestjs/common';

import { SFCredentialsService } from '../sf-credentials/sf-credentials.service';
import { SFFieldsService } from '../sf-fields/sf-fields.service';
import { SFModelsService } from '../sf-models/sf-models.service';
import { ExecutorCall } from './types';

@Injectable({})
export class ExecutorService {
  private logger: Logger = new Logger(ExecutorService.name);

  constructor(
    private sfCredentialsService: SFCredentialsService,
    private sfFieldsService: SFFieldsService,
    private sfModelsService: SFModelsService,
  ) {}

  async execute(data: ExecutorCall) {
    const { service, method, args } = data;

    this.logger.log(`
        New Execution Request for ${service}
        Method [${method}]
        Args   [${args}]
    `);

    //   Validate the service and method
    if (this[service] && typeof this[service][method] == 'function') {
      console.log('Here');
      try {
        const response = await this[service][method](...args);
        return {
          statusCode: 200,
          message: 'EXECUTED',
          data: response,
        };
      } catch (error) {
        this.logger.error(`
            Execution error,
            Trace: ${error}
        `);

        throw new BadRequestException(
          `Failed to execute ${service}.${method}, please check if correct args where provided`,
        );
      }
    }

    throw new BadRequestException(
      `Invalid service or method execution attempted`,
    );
  }
}
