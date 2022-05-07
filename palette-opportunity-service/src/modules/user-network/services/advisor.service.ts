import { SfService } from '@gowebknot/palette-salesforce-service';
import { Notifier } from '@gowebknot/palette-wrapper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  async getAdvisor(
    id: string,
    instituteId: string,
  ): Promise<AdvisorBEResponse> {
    const responseData: SFAdvisorContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name,prod_uuid , dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Designation, Account_Name, Profile_Picture',
        {
          Id: id,
        },
        {},
        instituteId,
      );

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
      Designation,
      Account_Name,
      Profile_Picture,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`Advisor with ID "${id}" not found`);
    }
    const getInstitute = await this.sfService.models.affiliations.get(
      'Organization',
      {
        Contact: id,
        // Role: 'Advisor',
      },
      {},
      instituteId,
    );
    console.log("second",getInstitute);


    const Institute_Id = getInstitute[0].Organization; // Real Institute Id

    const institute: AdvisorInstituteName[] | null =
      await this.sfService.models.accounts.get(
        'Id, Name,program_logo',
        {
          Id: Institute_Id,
        },
        {},
        instituteId,
      );
      console.log("third",institute);


    // const instituteName: string | null =
    //   institute === null ? null : institute.map(c => c.Name).toString();

    const advisorData: AdvisorBEResponse = {
      Id: Id,
      name: Name,
      firebase_uuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      instituteId: institute[0].Id,
      instituteLogo: institute[0].program_logo,
      institute_name: institute[0].Name,
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
      accountName: Account_Name,
    };

    return advisorData;
  }

  /** Retrieve all the students of a advisor
   *  @param {string} userId - The id of the mentor
   * @returns {Object} student details of the advisor
   */
  async getAdvisorDetailsStudents(
    mentorId: string,
    instituteId: string,
  ): Promise<AdvisorStudents> {
    const filteredStudents = await this.getFilteredStudents(
      mentorId,
      instituteId,
    );
    const advisor = await this.getAdvisor(mentorId, instituteId);
    return {
      statusCode: 200,
      data: { mentor: advisor, students: filteredStudents },
    };
  }

  // getting all students from relationship table with relationship type mentor and id of the mentor with the current mentor
  async getFilteredStudents(
    mentorId: string,
    instituteId: string,
  ): Promise<StudentResponse[]> {
    const students: advisorStudentRelation[] =
      await this.sfService.models.relationships.get(
        'Id, Name, Contact, Contact.Name, Contact.Grade, Related_Contact.Id, Related_Contact.Name, Type, Related_Contact.Primary_Educational_Institution, Related_Contact.Profile_Picture, Related_Contact.IsRegisteredOnPalette, Related_Contact.Is_Deactive',
        {
          Contact: mentorId,
          Type: MentorSubRoles, // Mentor ==> Advisor
        },
        {},
        instituteId,
      );
      console.log("first",students);
      

    // if (students.length === 0) {
    //   throw new NotFoundException('NO STUDENTS FOUND');
    // }

    // filtering data
    const filteredStudents = [];
    students.map((c) => {
      if (c.Related_Contact.Is_Deactive === false) {
        const filteredObj = {
          Id: c.Related_Contact.Id,
          name: c.Related_Contact.Name,
          grade: c.Related_Contact.Grade || null,
          profilePicture: c.Related_Contact.Profile_Picture || null,
          institute: c.Related_Contact.Primary_Educational_Institution || null,
          isRegistered: c.Related_Contact.IsRegisteredOnPalette,
        };
        filteredStudents.push(filteredObj);
      }
    });

    return filteredStudents;
  }
}
