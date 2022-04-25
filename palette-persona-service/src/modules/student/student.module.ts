import { Module } from '@nestjs/common';

import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { CachingService, SfModule } from '@gowebknot/palette-salesforce-service';
@Module({
  imports: [SfModule.forRoot(), CachingService],
  providers: [StudentService],
  exports: [StudentService],
  controllers: [StudentController],
})
export class StudentModule {}
