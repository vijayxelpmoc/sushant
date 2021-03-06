import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SfService } from '@gowebknot/palette-salesforce-service';

import { SFContact } from '@src/types';
import { Errors, Responses } from '@src/constants';
import {
  ParentBEResponse,
  ParentInstituteName,
  ParentStudentListSF,
  ParentUpdateResponse,
  SFParentContact,
} from './types/parent-interface';
import { GuardianSubRoles } from '@src/roles/roles.enum';
import { UpdateSfParentDto } from './dto/parent-update-profile.dto';
@Injectable()
export class ParentService {
  constructor(private readonly sfService: SfService) {}

  /** sends parent details on the basis of the id
   *  @param {string} id - The id of the parent
   * @returns {Object} ParentBEResponse Interface
   */
  async getParent(
    id: string,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    const responseData: SFParentContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Profile_Picture, Account_Name, Primary_Educational_Institution',
        {
          Id: id,
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );

      console.log('responseData', responseData);
      

    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
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
      Profile_Picture,
      Account_Name,
    } = responseData[0];

    const studentList: ParentStudentListSF[] =
      await this.sfService.models.relationships.get(
        'Id, Contact.Id, Type, Relationship_Explanation, Related_Contact.Id, Description, Contact.Name, Contact.Profile_Picture, Contact.Is_Deactive',
        {
          Related_Contact: Id,
          Type: GuardianSubRoles,
          Program: programId,
        },
        {},
        instituteId,
      );
    
    console.log('studentList', studentList);

    const students: Array<{
      Id: string;
      Name: string;
      profilePicture: string;
    }> = [];

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

    console.log('students', students);

    // const parentData: ParentBEResponse = {
    const parentData: any = {
      Id: Id,
      name: Name,
      firebase_uuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
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
    };

    if (instituteId.startsWith('paws__')) {
      const institute = (
        await this.sfService.paws.programDetails(programId, instituteId)
      )[0];
      Object.assign(parentData, {
        instituteId: institute.Id,
        instituteLogo: institute.program_logo,
        institute_name: institute.Account_Name,
      });
    } else {
      const getInstitute = await this.sfService.models.affiliations.get(
        'Organization',
        {
          Contact: id,
          Organization: programId,
          // Role: 'Guardian',
        },
        {},
        instituteId,
      );

      const Institute_Id = getInstitute[0].Organization; // Real Institute Id
      // const Institute_Id = responseData[0].Primary_Educational_Institution__c;

      const institute: ParentInstituteName[] | null =
        await this.sfService.models.accounts.get(
          'Id, Account_Name, program_logo',
          {
            Id: Institute_Id,
            // Program: programId,
          },
          {},
          instituteId,
        );

      Object.assign(parentData, {
        instituteId: institute[0].Id,
        instituteLogo: institute[0].program_logo,
        institute_name: institute[0].Account_Name,
      });
    }
    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: parentData,
    };
  }

  /** updates parent profile details
   *  @param {UpdateSfAdvisorDto} updateSfAdvisorDto contains attributes that needs to be updated in the advisor profile data
   * @returns {Object} status code and message
   */
  async update(
    id: string,
    updateSfParentDto: UpdateSfParentDto,
    instituteId: string,
    programId: string,
  ) {
    const responseData: SFParentContact[] =
      await this.sfService.generics.contacts.get(
        'Name, Palette_Email',
        {
          Id: id,
          Primary_Educational_Institution: programId,
        },
        {},
        instituteId,
      );

    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
    }

    console.log('responseData', responseData);
    console.log('updateSfParentDto', updateSfParentDto);
    

    const {
      facebook,
      whatsapp,
      instagram,
      website,
      website_Title,
      github,
      linkedin,
    } = updateSfParentDto;

    const updateObj: any = {};
    updateObj.Primary_Educational_Institution = programId;
    updateObj.Facebook = facebook;
    updateObj.Whatsapp = whatsapp;
    updateObj.Instagram = instagram;
    updateObj.Website = website;
    updateObj.Website_Title = website_Title;
    updateObj.Github = github;
    updateObj.LinkedIn_URL = linkedin;

    // const updateObj: any = {};
    // updateObj.Primary_Educational_Institution = programId;
    // if (updateSfParentDto.hasOwnProperty('facebook')) {
    //   const { facebook } = updateSfParentDto;
    //   updateObj.Facebook = facebook;
    // }

    // if (updateSfParentDto.hasOwnProperty('whatsapp')) {
    //   const { whatsapp } = updateSfParentDto;
    //   updateObj.Whatsapp = whatsapp;
    // }

    // if (updateSfParentDto.hasOwnProperty('instagram')) {
    //   const { instagram } = updateSfParentDto;
    //   updateObj.Instagram = instagram;
    // }

    // if (updateSfParentDto.hasOwnProperty('website')) {
    //   const { website } = updateSfParentDto;
    //   updateObj.Website = website;
    // }

    // if (updateSfParentDto.hasOwnProperty('website_Title')) {
    //   const { website_Title } = updateSfParentDto;
    //   updateObj.Website_Title = website_Title;
    // }

    // if (updateSfParentDto.hasOwnProperty('github')) {
    //   const { github } = updateSfParentDto;
    //   updateObj.Github = github;
    // }

    // if (updateSfParentDto.hasOwnProperty('linkedin')) {
    //   const { linkedin } = updateSfParentDto;
    //   updateObj.LinkedIn_URL = linkedin;
    // }

    const updateUser: ParentUpdateResponse =
      await this.sfService.generics.contacts.update(id, updateObj, instituteId);

    console.log('UU - ', updateUser);

    if (instituteId.startsWith('paws__') && updateUser[0].Id) {
      return {
        statusCode: 200,
        message: Responses.PROFILE_UPDATED,
      };
    } else if (updateUser.id && updateUser.success) {
      return {
        statusCode: 200,
        message: Responses.PROFILE_UPDATED,
      };
    } else {
      throw new BadRequestException(
        'Exception occured unable save the changes',
      );
    }
  }
}
