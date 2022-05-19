import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { SFContact } from '@src/types';
import { SFStudentWorkExperience, StudentInstituteName, WorkExperience } from './types';
import { StudentUpdateProfileDto } from './dto';
import { Errors, Responses } from '@src/constants';

@Injectable()
export class StudentService {
  constructor(private readonly sfService: SfService) {}

  // Internal Util Method

  async _mapStudentWorkExperience(
    workExp: any[],
    instituteId: string,
    programId: string,
  ): Promise<Array<any>> {
    return await Promise.all(
      workExp.map(async c => {
        const orgName: StudentInstituteName[] = await this.sfService.models.accounts.get(
          'Account_Name',
          {
            Id: c.Organization,
          },
          {},
          instituteId,
        );
        const workObj: any = {
          organizationName: orgName[0].Account_Name,
          role: c.Role,
          startDate: c.Start_Date,
          endDate: c.End_Date,
        };
        return workObj;
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

    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: studentProfile,
    };
  }

  /** sends student details on the basis of the id
   *  @param {string} id - The id of the student
   * @returns {Object} StudentBEResponse Interface
   */
   async getStudent(id: string, instituteId: string, programId: string): Promise<any> {
    const responseData: SFContact[] = await this.sfService.generics.contacts.get(
      'Id, Name, prod_uuid, dev_uuid, Birthdate, Gender, Grade, Student_ID, Phone, Palette_Email, Interests, skills, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Primary_Educational_Institution, Profile_Picture, Account_Name',
      {
        Id: id,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );

    if (!responseData) {
      throw new NotFoundException(`student with ID "${id}" not found`);
    }

    const {
      Id,
      Name,
      prod_uuid,
      dev_uuid,
      Birthdate,
      Gender,
      Grade,
      Student_ID,
      Phone,
      Palette_Email,
      Interests,
      skills,
      MailingCity,
      MailingCountry,
      MailingState,
      MailingPostalCode,
      MailingStreet,
      Facebook,
      Whatsapp,
      Instagram,
      Website,
      Website_Title,
      Github,
      LinkedIn_URL,
      Primary_Educational_Institution,
      Profile_Picture,
      Account_Name,
    } = responseData[0];


    const getInstitute = await this.sfService.models.affiliations.get(
      'Organization',
      {
        Contact: id,
        Role: 'Student',
        Organization: programId,
      },
      {},
      instituteId,
    );
    const Institute_Id = getInstitute[0].Organization; // Real Institute Id
    // const Institute_Id = responseData[0].Primary_Educational_Institution__c;
    const institute:
      | StudentInstituteName[]
      | null = await this.sfService.models.accounts.get('Id, Account_Name, program_logo', {
      Id: Institute_Id,
    }, {}, instituteId);

    const instituteName: string | null =
      institute === null ? null : institute.map(c => c.Account_Name).toString();

    const workExp: any[] = await this.sfService.models.affiliations.get(
      'Id, Affiliation_Name, Organization, Affiliation_Type, Contact, End_Date, Start_Date, Role, Tenure, Description, Job_Type, Designation',
      {
        Contact: Id,
        Affiliation_Type: 'Business Organization',
        Organization: programId,
      },
      {},
      instituteId,
    );
    const studentWorkExperience: any[] = await this._mapStudentWorkExperience(
      workExp,
      instituteId,
      programId,
    );

    const studentInterests: string[] =
      Interests === null ? null : Interests.split(',');
    const studentSkills: string[] =
      skills === null ? null : skills.split(',');

    const studentData: any = {
      Id: Id,
      name: Name,
      firebase_uuid:
        process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      DOB: Birthdate,
      gender: Gender,
      education: [
        {
          instituteId: institute[0].Id,
          instituteLogo: institute[0].program_logo,
          institute_name: institute[0].Account_Name,
          course: Grade,
          roll_no: Student_ID,
        },
      ],
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      work_experience: studentWorkExperience,
      interests: studentInterests,
      mailingCity: MailingCity,
      mailingCountry: MailingCountry,
      mailingState: MailingState,
      mailingStreet: MailingStreet,
      mailingPostalCode: MailingPostalCode,
      facebook_link: Facebook,
      whatsapp_link: Whatsapp,
      instagram_link: Instagram,
      website_link: Website,
      website_Title: Website_Title,
      github_link: Github,
      linkedin_link: LinkedIn_URL,
      skills: studentSkills,
      projects: [],
      activities: [],
    };

    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: studentData,
    };
  }

  /** sends student update details on the basis of the id and updatesfStudentDto bodies
   *  @param {string} id - The id of the student & UpdatesfStudentDto
   * @returns {Object} StudentUpdateBEResponse Interface
   */
   async updateStudentProfile(
    id: number,
    updateProfileDto: StudentUpdateProfileDto,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    const responseData: any[] = await this.sfService.generics.contacts.get(
      'Id, Name, prod_uuid, dev_uuid, Birthdate, Gender, Grade, Student_ID, Phone, Palette_Email, Interests, skills, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Primary_Educational_Institution, Profile_Picture, Account_Name',
      {
        Id: id,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );

    if (!responseData) {
      throw new NotFoundException(`student with ID "${id}" not found`);
    }

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

    const { Id } = responseData[0];
    const updatedStudent: any = {};
    updatedStudent.Primary_Educational_Institution = programId;
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


    
    const updateUser: any = await this.sfService.generics.contacts.update(
      Id,
      updatedStudent,
      instituteId,
    );
    return {
      statusCode: 200,
      message: Responses.PROFILE_UPDATED,
    };
  }
}
