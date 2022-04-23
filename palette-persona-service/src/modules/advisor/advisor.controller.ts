import {Controller} from '@nestjs/common';
import {CachingService} from '@gowebknot/palette-wrapper';
import { AdvisorService } from './advisor.service';

@Controller({
  path: 'advisor',
})
export class AdvisorController {
  constructor(
    private advisorService: AdvisorService,
    private cachingService: CachingService,
  ) {}

}

