import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Notifier } from '@gowebknot/palette-wrapper';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { Errors, Responses } from '@src/constants';
import {
  AdvisorBEResponse,
  AdvisorInstituteName,
  SFAdvisorContact,
} from '@src/types';
import { UpdateSfAdvisorDto } from './dto/advisor-update-profile.dto';
import { AdvisorUpdateResponse } from './types/advisor-interface';
@Injectable()
export class AdvisorService {
  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  async getAdvisor(id: string, instituteId: string) {
    const responseData: SFAdvisorContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Designation, Account_Name, Profile_Picture',
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

    const Institute_Id = getInstitute[0].Organization; // Real Institute Id

    const institute: AdvisorInstituteName[] | null =
      await this.sfService.models.accounts.get(
        'Id, Account_Name, program_logo',
        {
          Id: Institute_Id,
        },
        {},
        instituteId,
      );

    const advisorData: AdvisorBEResponse = {
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
      data: advisorData,
    };
  }

  async update(
    id: string,
    updateSfAdvisorDto: UpdateSfAdvisorDto,
    instituteId: string,
  ) {
    const responseData: SFAdvisorContact[] = await this.sfService.generics.contacts.get(
      'Name, Palette_Email',
      {
        Id: id,
      },
      {},
      instituteId,
    );

    if (!responseData) {
      throw new NotFoundException(`Advisor with #${id} not found`);
    }

    const updateObj: any = {};
    //checking the input from dtos and updating
    if (updateSfAdvisorDto.hasOwnProperty('facebook')) {
      const { facebook } = updateSfAdvisorDto;
      updateObj.Facebook = facebook;
    }

    if (updateSfAdvisorDto.hasOwnProperty('whatsapp')) {
      const { whatsapp } = updateSfAdvisorDto;
      updateObj.Whatsapp = whatsapp;
    }

    if (updateSfAdvisorDto.hasOwnProperty('instagram')) {
      const { instagram } = updateSfAdvisorDto;
      updateObj.Instagram = instagram;
    }

    if (updateSfAdvisorDto.hasOwnProperty('github')) {
      const { github } = updateSfAdvisorDto;
      updateObj.Github = github;
    }

    if (updateSfAdvisorDto.hasOwnProperty('linkedin')) {
      const { linkedin } = updateSfAdvisorDto;
      updateObj.LinkedIn_URL = linkedin;
    }

    if (updateSfAdvisorDto.hasOwnProperty('website')) {
      const { website } = updateSfAdvisorDto;
      updateObj.Website = website;
    }

    if (updateSfAdvisorDto.hasOwnProperty('website_Title')) {
      const { website_Title } = updateSfAdvisorDto;
      updateObj.Website_Title = website_Title;
    }

    const updateUser: AdvisorUpdateResponse = await this.sfService.generics.contacts.update(
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
