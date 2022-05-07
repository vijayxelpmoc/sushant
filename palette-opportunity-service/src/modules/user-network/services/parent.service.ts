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
  ParentBEResponse,
  ParentInstituteName,
  ParentStudentListSF,
  SFParentContact,
} from '../types/parent-interface';

@Injectable()
export class ParentService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  /** sends parent details on the basis of the id
   *  @param {string} id - The id of the parent
   * @returns {Object} ParentBEResponse Interface
   */
  async getParent(id: string, instituteId: string): Promise<ParentBEResponse> {
    const responseData: SFParentContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name,prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Profile_Picture,Account_Name, Primary_Educational_Institution',
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
      Profile_Picture,
      Account_Name,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
    }

    const studentList: ParentStudentListSF[] =
      await this.sfService.models.relationships.get(
        'Id, Name, Contact, Type, Relationship_Explanation, Related_Contact, Description,Contact.Id, Contact.Name, Contact.Profile_Picture, Contact.Is_Deactive',
        {
          Related_Contact: Id,
          Type: GuardianSubRoles,
        },
        {},
        instituteId,
      );

      console.log("studentList",studentList);
      

    const students: Array<{
      Id: string;
      Name: string;
      profilePicture: string;
    }> = [];

    const getInstitute = await this.sfService.models.affiliations.get(
      'Organization',
      {
        Contact: id,
        // Role: 'Guardian',
      },
      {},
      instituteId,
    );

    const Institute_Id = getInstitute[0].Organization; // Real Institute Id
    // const Institute_Id = responseData[0].Primary_Educational_Institution;

    const institute: ParentInstituteName[] | null =
      await this.sfService.models.accounts.get(
        'Id, Name,program_logo',
        {
          Id: Institute_Id,
        },
        {},
        instituteId,
      );

    studentList.map((student) => {
      if (student.Contact.Is_Deactive === false) {
        const filterObj = {
          Id: student.Contact.Id,
          Name: student.Contact.Name,
          profilePicture: student.Contact.Profile_Picture,
        };
        students.push(filterObj);
      }
    });

    const parentData: ParentBEResponse = {
      Id: Id,
      name: Name,
      firebase_uuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
      instituteId: institute[0].Id,
      instituteLogo: institute[0].program_logo,
      institute_name: institute[0].Name,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      pupils: students,
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
    return parentData;
  }
}
