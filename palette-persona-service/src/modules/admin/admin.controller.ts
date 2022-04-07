import {Controller} from '@nestjs/common';
import {CachingService} from '@gowebknot/palette-wrapper';

import {AdminService} from './admin.service'; 

@Controller({
  path: 'admin',
})
export class AdminController {
  constructor(
    private adminService: AdminService,
    private cachingService: CachingService,
  ) {}

}
