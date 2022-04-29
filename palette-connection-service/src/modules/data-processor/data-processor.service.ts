import { Injectable, Logger } from '@nestjs/common';

import { SFCredentialsService } from '@src/modules/sf-credentials/sf-credentials.service';
import { SFFieldsService } from '@src/modules/sf-fields/sf-fields.service';
import { SFModelsService } from '@src/modules/sf-models/sf-models.service';

import { CachingService } from './caching.service';

@Injectable()
export class DataProcessorService {
  private logger: Logger = new Logger(DataProcessorService.name);

  constructor(
    private cachingService: CachingService,
    private sfCredentialsService: SFCredentialsService,
    private sfFieldsService: SFFieldsService,
    private sfModelsService: SFModelsService,
  ) {}

  private async process() {
    const credentials = await this.sfCredentialsService.get();
    const models = await this.sfModelsService.get();
    const fields = await this.sfFieldsService.get();

    const repeatedObjects: any = {};

    for (const credential of credentials) {
      const { instituteId } = credential;
      const store: any = {};

      const currentInstituteModels = {};

      for (const model of models) {
        if (model.crmId === instituteId) {
          if (
            currentInstituteModels[model.objectGlobalKeyname] ===
            model.objectCrmKeyname
          ) {
            continue;
          } else {
            currentInstituteModels[model.objectGlobalKeyname] =
              model.objectCrmKeyname;
          }
        }
      }

      store['models'] = currentInstituteModels;

      for (const field of fields) {
        if (field.crmId === instituteId) {
          const objName = field.objectName;

          if (repeatedObjects[objName] == instituteId) {
            continue;
          }

          const fieldValues: any = {};

          fields.map((f) => {
            if (f.crmId === instituteId && f.objectName === objName) {
              fieldValues[f.globalKeyname] = {
                value: f.crmKeyname,
                object: f.relatedToObject,
              };
            }
          });

          store[objName] = fieldValues;
          repeatedObjects[objName] = instituteId;

          if (repeatedObjects[objName] !== instituteId) {
            const fieldValues = {};
            fields.map((f) => {
              if (f.crmId === instituteId && f.objectName === objName) {
                fieldValues[f.globalKeyname] = {
                  value: f.crmKeyname,
                  object: f.relatedToObject,
                };
              }
            });

            store[objName] = fieldValues;
            repeatedObjects[objName] = instituteId;
          }

          if (this.cachingService.get(instituteId)) {
            this.cachingService.delete(instituteId);
          }

          this.cachingService.set(instituteId, store);
        }
      }
    }

    this.logger.log('Data processing completed');
  }

  async getById(instituteId: string) {
    this.logger.log(`Checking for data in cache | ${instituteId}`);
    const data = await this.cachingService.get(instituteId);
    if (data) {
      this.logger.log(`Data found, returning | ${instituteId}`);
      return data;
    }

    this.logger.log(
      `Data was not found, starting pre-processing | ${instituteId}`,
    );
    await this.process();
    return await this.cachingService.get(instituteId);
  }
}
