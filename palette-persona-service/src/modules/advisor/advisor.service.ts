import { Injectable, NotFoundException } from '@nestjs/common';
import { Notifier, SfService } from '@gowebknot/palette-wrapper';

@Injectable()
export class AdvisorService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

}
