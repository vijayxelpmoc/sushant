import { Injectable, NotFoundException } from '@nestjs/common';
import { Notifier } from '@gowebknot/palette-wrapper';
import { SfService } from '@gowebknot/palette-salesforce-service';


@Injectable()
export class AdminService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

}
