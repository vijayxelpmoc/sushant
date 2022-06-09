import { SfService } from '@gowebknot/palette-salesforce-service';
import { Notifier } from '@gowebknot/palette-wrapper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Responses } from '@src/constants';
import {
  GuardianSubRoles,
  MentorSubRoles,
} from '@src/modules/opportunity/types';
import {
  AdvisorBEResponse,
  AdvisorInstituteName,
  advisorStudentRelation,
  AdvisorStudents,
  SFAdvisorContact,
  StudentResponse,
} from '../types/advisor-interface';

@Injectable()
export class AdvisorService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  /** sends advisor details on the basis of the id
   *  @param {string} id - The id of the advisor
   * @returns {Object} AdvisorBEResponse Interface
   */
   async getAdvisor(id: string, instituteId: string, programId: string) {
    const responseData: SFAdvisorContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Account_Name, Profile_Picture',
        {
          Id: id,
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );

    if (!responseData) {
      throw new NotFoundException(`Advisor with ID "${id}" not found`);
    }

    const {
      Id,
      Name,
      prod_uuid,
      dev_uuid,
      Phone,
      Palette_Email,
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
      Designation = '',
      Account_Name,
      Profile_Picture,
    } = responseData[0];

    const advisorData: any = {
      Id: Id,
      name: Name,
      firebase_uuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      instituteId: null,
      instituteLogo: null,
      institute_name: null,
      designation: Designation,
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
    };

    if (instituteId.startsWith('paws__')) {
      const instituteDetails = (
        await this.sfService.paws.programDetails(programId, instituteId)
      )[0];

      advisorData.instituteId = programId;
      advisorData.instituteLogo = instituteDetails.Logo;
      advisorData.institute_name = instituteDetails.Name;
    } else {
      const getInstitute = await this.sfService.models.affiliations.get(
        'Organization',
        {
          Contact: id,
          Role: 'Advisor',
          Organization: programId,
        },
        {},
        instituteId,
      );

      const Institute_Id = getInstitute[0].Organization; // Real Institute Id

      const institute: any[] | null =
        await this.sfService.models.accounts.get(
          'Id, Account_Name, program_logo',
          {
            Id: Institute_Id,
            // Program: programId,
          },
          {},
          instituteId,
        );

      advisorData.instituteId = institute[0].Id;
      advisorData.instituteLogo = institute[0].program_logo;
      advisorData.institute_name = institute[0].Account_Name;
    }

    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: advisorData,
    };
  }

  /** Retrieve all the students of a advisor
   *  @param {string} userId - The id of the mentor
   * @returns {Object} student details of the advisor
   */
  async getAdvisorDetailsStudents(
    mentorId: string,
    instituteId: string,
    programId: string,
  ): Promise<AdvisorStudents> {
    const filteredStudents = await this.getFilteredStudents(
      mentorId,
      instituteId,
      programId
    );
    const advisor = await this.getAdvisor(mentorId, instituteId, programId);
    return {
      statusCode: 200,
      data: { mentor: advisor.data, students: filteredStudents },
    };
  }

  // getting all students from relationship table with relationship type mentor and id of the mentor with the current mentor
  async getFilteredStudents(
    mentorId: string,
    instituteId: string,
    programId: string,
  ): Promise<StudentResponse[]> {
    const students: any[] =
      await this.sfService.models.relationships.get(
        'Id, Contact.Id, Contact.Name, Contact.Grade, Contact.Profile_Picture, Contact.Primary_Educational_Institution, Contact.IsRegisteredOnPalette, Contact.Is_Deactive',
        {
          Related_Contact: mentorId,
          // Type: MentorSubRoles, // Mentor ==> Advisor
        },
        {},
        instituteId,
      );
      // console.log("first",students);
      

    // if (students.length === 0) {
    //   throw new NotFoundException('NO STUDENTS FOUND');
    // }

    // filtering data
    const filteredStudents = [];
    students.map((c) => {
      if (c.Contact.Is_Deactive === false) {
        const filteredObj = {
          Id: c.Contact.Id,
          name: c.Contact.Name,
          grade: c.Contact.Grade || null,
          profilePicture: c.Contact.Profile_Picture || null,
          institute: c.Contact.Primary_Educational_Institution || null,
          isRegistered: c.Contact.IsRegisteredOnPalette,
        };
        filteredStudents.push(filteredObj);
      }
    });

    return filteredStudents;
  }
}
