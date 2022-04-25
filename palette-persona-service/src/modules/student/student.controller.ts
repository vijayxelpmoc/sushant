import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
} from '@gowebknot/palette-wrapper';

import { StudentUpdateProfileDto } from './dto';
import { StudentService } from './student.service';
import { CachingService } from '@gowebknot/palette-salesforce-service';

@Controller({
  path: 'student',
})
export class StudentController {
  constructor(
    private studentService: StudentService,
    private cachingService: CachingService,
  ) {}

  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  async getStudent(
    @Request() req,
    @Query('instituteId') instituteId: string,  
  ) {
    // Cache the user profile as it's accessed multiple
    // times throughout the application
    const cacheKey = `student_${req.user.id}`;
    const cachedStudent = await this.cachingService.get(cacheKey);
    if (cachedStudent) {
      return cachedStudent;
    }
    const student = await this.studentService.getStudent(req.user.id, instituteId);
    await this.cachingService.set(cacheKey, student);
    return student;
  }

  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  async updateStudent(
    @Request() req,
    @Body() updateProfileDto: StudentUpdateProfileDto,
    @Body('instituteId') instituteId: string,  
  ) {
    return await this.studentService.updateStudentProfile(
      req.user.id,
      updateProfileDto,
      instituteId,
    );
  }

  @hasRoles(
    Role.Parent,
    Role.Administrator,
    Role.Advisor,
    Role.Observer,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id?')
  async getStudentDetails(
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,  
  ) {
    return await this.studentService.getStudent(id, instituteId);
  }
}
