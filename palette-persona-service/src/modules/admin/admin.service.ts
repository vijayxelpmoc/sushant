import { Injectable, NotFoundException } from '@nestjs/common';
import { Notifier, SfService } from '@gowebknot/palette-wrapper';

@Injectable()
export class AdminService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

}
