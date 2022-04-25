import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { SFContact } from '@src/types';
import { SFStudentWorkExperience, WorkExperience } from './types';
import { StudentUpdateProfileDto } from './dto';
import { Errors, Responses } from '@src/constants';

@Injectable()
export class StudentService {
  constructor(private readonly sfService: SfService) {}

  // Internal Util Method

  private async _mapStudentWorkExperience(
    experiences: SFStudentWorkExperience[],
    instituteId: string,
  ): Promise<Array<WorkExperience>> {
    return await Promise.all(
      experiences.map(async (exp) => {
        const organization = (
          await this.sfService.models.accounts.get(
            'Name',
            {
              Id: exp.Organization,
            },
            {},
            instituteId,
          )
        )[0];

        return {
          organization,
          role: exp.Role,
          startDate: exp.Start_Date,
          endDate: exp.End_Date,
        };
      }),
    );
  }

  private _mapStudentProfile(
    student: SFContact,
    institute: any,
    experiences: WorkExperience[],
    interests: string[],
    skills: string[],
  ) {
    const {
      Id,
      Name: name,
      prod_uuid,
      dev_uuid,
      Birthdate: dob,
      Gender: gender,
      Grade: course,
      Student_ID: rollNumber,
      Phone: phone,
      Palette_Email: email,
      MailingCity: city,
      MailingCountry: country,
      MailingState: state,
      MailingPostalCode: postalCode,
      MailingStreet: street,
      Facebook: facebook,
      Whatsapp: whatsapp,
      Instagram: instagram,
      Website: url,
      Website_Title: title,
      Github: github,
      LinkedIn_URL: linkedin,
      Profile_Picture: profilePicture,
    } = student;
    const studentProfile = {
      id: Id,
      name,
      firebaseUuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      dob,
      gender,
      email,
      phone,
      profilePicture,
      institute: {
        id: institute.Id,
        logo: institute.program_logo,
        name: institute.Account_Name,
        course,
        rollNumber,
      },
      mailingAddress: {
        street,
        city,
        state,
        country,
        postalCode,
      },
      social: {
        facebook,
        whatsapp,
        instagram,
        website: {
          title,
          url,
        },
        linkedin,
        github,
      },
      workExperience: experiences,
      interests,
      skills,
      // TODO: These 2 need review
      projects: [],
      activities: [],
    };
    return studentProfile;
  }

  // Service Methods

  async getStudent(id: string, instituteId: string) {
    const student: SFContact = (
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Birthdate, Gender, Grade, Student_ID, Phone, Palette_Email, Interests, skills, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Primary_Educational_Institution, Profile_Picture, Account_Name',
        {
          Id: id,
        },
        {},
        instituteId,
      )
    )[0];
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get Student institute details
    const studentInstitute = (
      await this.sfService.models.affiliations.get(
        'Organization',
        {
          Contact: id,
          Role: 'Student',
        },
        {},
        instituteId,
      )
    )[0];
    const institute = (
      await this.sfService.models.accounts.get(
        'Id, Account_Name, program_logo',
        {
          Id: studentInstitute.Organization,
        },
        {},
        instituteId,
      )
    )[0];

    // Student Exp, Skills, Interests
    const studentWorkExperience: SFStudentWorkExperience[] =
      await this.sfService.models.affiliations.get(
        'Id, Name, Organization, Affiliation_Type, Contact, End_Date, Start_Date, Role, Tenure, Description, Job_Type, Designation',
        {
          Contact: id,
          // Affiliation_Type: 'Educational Institution',
        },
        {},
        instituteId,
      );

    const experiences = await this._mapStudentWorkExperience(
      studentWorkExperience,
      instituteId,
    );

    const interests =
      (student.Interests && student.Interests.split(',')) || null;

    const skills = (student.skills && student.skills.split(',')) || null;

    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: this._mapStudentProfile(
        student,
        institute,
        experiences,
        interests,
        skills,
      ),
    };
  }

  async updateStudentProfile(
    id: string,
    updateProfileDto: StudentUpdateProfileDto,
    instituteId,
  ) {
    const {
      interests,
      skills,
      facebook,
      whatsapp,
      instagram,
      website,
      websiteTitle,
      github,
      linkedin,
    } = updateProfileDto;

    const student = (
      await this.sfService.generics.contacts.get(
        'Name',
        {
          Id: id,
        },
        {},
        instituteId,
      )
    )[0];
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = {};

    if (interests) {
      if (interests.join(',').length > 250) {
        throw new BadRequestException(Errors.MAX_INTERESTS_LIMIT);
      }
      updatedStudent['Interests'] = interests.join(',');
    }

    if (skills) {
      if (skills.join(',').length > 250) {
        throw new BadRequestException(Errors.MAX_SKILLS_LIMIT);
      }
      updatedStudent['skills'] = skills.join(',');
    }

    facebook && (updatedStudent['Facebook'] = facebook);
    whatsapp && (updatedStudent['Whatsapp'] = whatsapp);
    instagram && (updatedStudent['Instagram'] = instagram);
    website && (updatedStudent['Website'] = website);
    websiteTitle && (updatedStudent['Website_Title'] = websiteTitle);
    github && (updatedStudent['Github'] = github);
    linkedin && (updatedStudent['LinkedIn_URL'] = linkedin);

    await this.sfService.generics.contacts.update(
      id,
      updatedStudent,
      instituteId,
    );

    return {
      statusCode: 200,
      message: Responses.PROFILE_UPDATED,
    };
  }
}
