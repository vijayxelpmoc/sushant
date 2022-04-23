import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { SFContact } from '@src/types';
import { Errors, Responses } from '@src/constants';

@Injectable()
export class ParentService {
  constructor(private readonly sfService: SfService) {}
}
