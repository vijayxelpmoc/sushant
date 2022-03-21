import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SfService } from '@gowebknot/palette-wrapper';

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
  ): Promise<Array<WorkExperience>> {
    return await Promise.all(
      experiences.map(async (exp) => {
        const organization = (
          await this.sfService.models.accounts.get('Name', {
            Id: exp.hed__Account__c,
          })
        )[0];

        return {
          organization,
          role: exp.hed__Role__c,
          startDate: exp.hed__StartDate__c,
          endDate: exp.hed__EndDate__c,
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
      prod_uuid__c,
      dev_uuid__c,
      Birthdate: dob,
      hed__Gender__c: gender,
      Grade__c: course,
      k12kit__Student_ID__c: rollNumber,
      Phone: phone,
      Palette_Email__c: email,
      MailingCity: city,
      MailingCountry: country,
      MailingState: state,
      MailingPostalCode: postalCode,
      MailingStreet: street,
      Facebook__c: facebook,
      Whatsapp__c: whatsapp,
      Instagram__c: instagram,
      Website__c: url,
      WebsiteTitle__c: title,
      Github__c: github,
      LinkedIn_URL__c: linkedin,
      Profile_Picture__c: profilePicture,
    } = student;
    const studentProfile = {
      id: Id,
      name,
      firebaseUuid:
        process.env.NODE_ENV === 'prod' ? prod_uuid__c : dev_uuid__c,
      dob,
      gender,
      email,
      phone,
      profilePicture,
      institute: {
        id: institute.id,
        logo: institute.program_logo__c,
        name: institute.Name,
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

  async getStudent(id: string) {
    const student: SFContact = (
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid__c, dev_uuid__c, Birthdate, hed__Gender__c, Grade__c, k12kit__Student_ID__c, Phone, Palette_Email__c, Interests__c, skills__c, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook__c, Whatsapp__c, Instagram__c, Website__c, WebsiteTitle__c, Github__c, LinkedIn_URL__c, Primary_Educational_Institution__c, Profile_Picture__c,AccountId',
        {
          Id: id,
        },
      )
    )[0];
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get Student institute details
    const studentInstitute = (
      await this.sfService.models.affiliations.get('hed__Account__c', {
        hed__Contact__c: id,
        hed__Role__c: 'Student',
      })
    )[0];
    const institute = (
      await this.sfService.models.accounts.get('Id, Name,program_logo__c', {
        Id: studentInstitute.hed__Account__c,
      })
    )[0];

    // Student Exp, Skills, Interests
    const studentWorkExperience: SFStudentWorkExperience[] =
      await this.sfService.models.affiliations.get(
        'Id, Name, hed__Account__c, hed__Affiliation_Type__c, hed__Contact__c, hed__EndDate__c, hed__StartDate__c, hed__Role__c, Tenure__c,  hed__Description__c, Job_Type__c, Designation__c',
        {
          hed__Contact__c: id,
          hed__Affiliation_Type__c: 'Business Organization',
        },
      );
    const experiences = await this._mapStudentWorkExperience(
      studentWorkExperience,
    );

    const interests =
      (student.Interests__c && student.Interests__c.split(',')) || null;

    const skills = (student.skills__c && student.skills__c.split(',')) || null;

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
      await this.sfService.generics.contacts.get('Name', {
        Id: id,
      })
    )[0];
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const updatedStudent = {};

    if (interests) {
      if (interests.join(',').length > 250) {
        throw new BadRequestException(Errors.MAX_INTERESTS_LIMIT);
      }
      updatedStudent['Interests__c'] = interests.join(',');
    }

    if (skills) {
      if (skills.join(',').length > 250) {
        throw new BadRequestException(Errors.MAX_SKILLS_LIMIT);
      }
      updatedStudent['skills__c'] = skills.join(',');
    }

    facebook && (updatedStudent['Facebook__c'] = facebook);
    whatsapp && (updatedStudent['Whatsapp__c'] = whatsapp);
    instagram && (updatedStudent['Instagram__c'] = instagram);
    website && (updatedStudent['Website__c'] = website);
    websiteTitle && (updatedStudent['WebsiteTitle__c'] = websiteTitle);
    github && (updatedStudent['Github__c'] = github);
    linkedin && (updatedStudent['LinkedIn_URL__c'] = linkedin);

    await this.sfService.generics.contacts.update(id, updatedStudent);

    return {
      statusCode: 200,
      message: Responses.PROFILE_UPDATED,
    };
  }
}
