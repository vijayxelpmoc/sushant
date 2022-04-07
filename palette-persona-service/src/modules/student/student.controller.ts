import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  hasRoles,
  Role,
  CachingService,
} from '@gowebknot/palette-wrapper';

import { StudentUpdateProfileDto } from './dto';
import { StudentService } from './student.service';

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
  async getStudent(@Request() req) {
    // Cache the user profile as it's accessed multiple
    // times throughout the application
    const cacheKey = `student_${req.user.id}`;
    const cachedStudent = await this.cachingService.get(cacheKey);
    if (cachedStudent) {
      return cachedStudent;
    }
    const student = await this.studentService.getStudent(req.user.id);
    await this.cachingService.set(cacheKey, student);
    return student;
  }

  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile/update')
  async updateStudent(
    @Request() req,
    @Body() updateProfileDto: StudentUpdateProfileDto,
  ) {
    return await this.studentService.updateStudentProfile(
      req.user.id,
      updateProfileDto,
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
  @Get(':id')
  async getStudentDetails(@Param('id') id: string) {
    return await this.studentService.getStudent(id);
  }
}
