import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Notifier } from '@gowebknot/palette-wrapper';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { Errors, Responses } from '@src/constants';
import {
  SFAdminContact,
  AdminInstituteName,
  AdminBEResponse,
} from '@src/types';
import { UpdateSfAdminDto } from './dto/admin-update-profile.dto';
import { AdminUpdateResponse } from './types/admin-interface';

@Injectable()
export class AdminService {
  private notifier: Notifier;
  constructor(private readonly sfService: SfService) {
    // this.notifier = new Notifier();
  }

  async getAdmin(id: string, instituteId: string) {
    const responseData: SFAdminContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Designation, Account_Name, Profile_Picture',
        {
          Id: id,
        },
        {},
        instituteId,
      );

    if (!responseData) {
      throw new NotFoundException(`Admin with ID "${id}" not found`);
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
      Designation,
      Account_Name,
      Profile_Picture,
    } = responseData[0];

    
    const getInstitute = await this.sfService.models.affiliations.get(
      'Organization',
      {
        Contact: id,
        // Role: 'Admin',
      },
      {},
      instituteId,
    );

    const Institute_Id = getInstitute[0].Organization; // Real Institute Id

    const institute: AdminInstituteName[] | null =
      await this.sfService.models.accounts.get(
        'Id, Account_Name, program_logo',
        {
          Id: Institute_Id,
        },
        {},
        instituteId,
      );

    const adminData: AdminBEResponse = {
      Id: Id,
      name: Name,
      firebase_uuid: process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      instituteId: institute[0].Id,
      instituteLogo: institute[0].program_logo,
      institute_name: institute[0].Account_Name,
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

    return {
      statusCode: 200,
      message: Responses.PROFILE_FETCHED,
      data: adminData,
    };
  }

  /** updates admin profile details
   *  @param {UpdateSfAdminDto} updateSfAdminDto - contains all the attributes that needs to be updated
   * @returns {Object} status code and message
   */
  async update(
    id: string,
    updateSfAdminDto: UpdateSfAdminDto,
    instituteId: string,
  ) {
    const responseData: any = this.sfService.generics.contacts.get(
      'Name, Palette_Email',
      {
        Id: id,
      },
      {},
      instituteId,
    );
    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
    }

    const updateObj: any = {};
    if (updateSfAdminDto.hasOwnProperty('facebook')) {
      const { facebook } = updateSfAdminDto;
      updateObj.Facebook = facebook;
    }

    if (updateSfAdminDto.hasOwnProperty('whatsapp')) {
      const { whatsapp } = updateSfAdminDto;
      updateObj.Whatsapp = whatsapp;
    }

    if (updateSfAdminDto.hasOwnProperty('instagram')) {
      const { instagram } = updateSfAdminDto;
      updateObj.Instagram = instagram;
    }

    if (updateSfAdminDto.hasOwnProperty('website')) {
      const { website } = updateSfAdminDto;
      updateObj.Website = website;
    }

    if (updateSfAdminDto.hasOwnProperty('websiteTitle')) {
      const { websiteTitle } = updateSfAdminDto;
      updateObj.Website_Title = websiteTitle;
    }

    if (updateSfAdminDto.hasOwnProperty('github')) {
      const { github } = updateSfAdminDto;
      updateObj.Github = github;
    }

    if (updateSfAdminDto.hasOwnProperty('linkedin')) {
      const { linkedin } = updateSfAdminDto;
      updateObj.LinkedIn_URL = linkedin;
    }

    const updateUser: AdminUpdateResponse = await this.sfService.generics.contacts.update(
      id,
      updateObj,
      instituteId,
    );

    if (updateUser.id && updateUser.success) {
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
