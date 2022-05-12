import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

      console.log(responseData);
      

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
    const responseData: SFAdvisorContact[] =
      await this.sfService.generics.contacts.get(
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

    const updateUser: AdvisorUpdateResponse =
      await this.sfService.generics.contacts.update(id, updateObj, instituteId);
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

  async getOpportunitydetail(
    notificationId,
    instituteId: string,
  ): Promise<any> {
    // notification details.
    const notification = await this.sfService.models.notifications.get(
      '*',
      {
        Opportunity: notificationId,
      },
      {},
      instituteId,
    );
    console.log(notification);
    
    // select id based on notification type.
    let id = null;
    const type = notification[0].Type;
    // for mofification id will be.
    if (notification[0].Type === 'Opportunity Modification Request') {
      id = notification[0].Modification;
    }
    // for opportunity id will be.
    if (
      notification[0].Type === 'Opportunity Approval Request' ||
      notification[0].Type === 'Opportunity Removal Request'
    ) {
      id = notification[0].Opportunity;
    }

    const filteredData = [];
    // get opportunity details.
    const res = await this.sfService.models.accounts.get(
      'Listed_by.Name, Listed_by.Profile_Picture, *',
      {
        Id: id,
      },
      {},
      instituteId,
    );
    // console.log("res",res);
    
    if (res.length !== 0) {
      res.map((event) => {
        const filteredDataObject = {
          Id: event.Id,
          creatorName: event.Listed_by.Name,
          creatorProfilePic: event.Listed_by.Profile_Picture,
          createdAt: event.Created_at,
          eventName: event.Name,
          category: event.Category,
          phone: event.Phone,
          venue: event.Venue,
          startDate: event.Start_Date,
          endDate: event.End_Date,
          description: event.Description,
          approvalStatus:
            type === 'Opportunity Removal Request'
              ? event.Removal_Status
              : event.Approval_Status,
          type: notification[0].Type,
        };
        // listing obj.
        filteredData.push(filteredDataObject);
      });
      return {
        statusCode: 200,
        message: 'In-ReviewOpportunityDetail',
        data: filteredData,
      };
    }

    // if id is of modification.
    const mods = await this.sfService.models.modifications.get(
      'Opportunity_Id.Listed_by.Name, Opportunity_Id.Listed_by.Profile_Picture, Opportunity_Id.Listed_by, *',
      {
        Id: id,
      },
      {},
      instituteId,
    );
    // console.log(mods);
    

    if (mods.length !== 0) {
      mods.map((event) => {
        const filteredDataObj = {
          Id: event.Id,
          creatorName: event.Opportunity_Id
            ? event.Opportunity_Id.Listed_by.Name
            : null,
          creatorProfilePic: event.Opportunity_Id
            ? event.Opportunity_Id.Listed_by.Profile_Picture
            : null,
          createdAt: event.Created_at,
          eventName: event.Account_Name,
          category: event.Cate,
          phone: event.Phone,
          venue: event.Venue,
          startDate: event.Start_Date,
          endDate: event.End_Date,
          description: event.Description,
          approvalStatus: event.Status,
          type: notification[0].Type,
        };
        //listing obj.
        filteredData.push(filteredDataObj);
      });
      return {
        statusCode: 200,
        message: 'In-ReviewOpportunityDetail',
        data: filteredData,
      };
    }
    throw new NotFoundException('Not Found');
  }

  // Opportunity Approvals
  async getOpportunityApprovals(userId: string, instituteId: string) {
    const opportunities = await this.sfService.models.accounts.get(
      '*',
      {
        Approval_Status: 'AdvisorReview',
        // Removal_Status: null || 'Rejected',
      },
      {},
      instituteId,
    );
    const approvalList = [];
    opportunities.map((opportunity) => {
      const dataObj = {
        Id: opportunity.Id,
        eventName: opportunity.Name,
        description: opportunity.Description,
        venue: opportunity.Venue,
        website: opportunity.Website,
        eventDate: opportunity.Start_Date,
        phone: opportunity.Phone,
        Type: opportunity.Category,
        approvalStatus: opportunity.Approval_Status,
        expirationDate: opportunity.End_Date,
      };
      approvalList.push(dataObj);
    });

    return {
      statusCode: 200,
      message:
        approvalList.length > 0 ? 'Pending Approvals' : 'No Pending Approvals',
      data: approvalList.length > 0 ? approvalList : null,
    };
  }

  async acceptOrRejectOpportunity(
    opportunityId: string,
    status: string,
    userId: string,
    instituteId: string,
  ) {
    const requestedOpportunity = (
      await this.sfService.models.accounts.get(
        '*',
        {
          Id: opportunityId,
        },
        {},
        instituteId,
      )
    );

    console.log(requestedOpportunity);
    

    if (!requestedOpportunity[0]) {
      throw new NotFoundException('Opportunity not found');
    }

    const response = await this.sfService.models.accounts.update(
      {
        Approval_Status: status,
      },
      opportunityId,
      instituteId,
    );
    let notificationTitle = ``;
    let notificationMsg = ``;
    if (response['success'] === true) {
      const opp = await this.sfService.models.accounts.get(
        '*',
        {
          Id: opportunityId,
        },
        {},
        instituteId,
      );
      if (status === 'In Review') {
        const insId = opp[0].ParentId;
        // fetch admin
        const admins = await this.sfService.models.affiliations.get(
          'Contact.Id',
          {
            Account: insId,
            Role: 'Admin',
          },
          {},
          instituteId,
        );
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `${opp[0].Name} opportunity requested for approval`;
        admins.map(async (admin) => {
          // create push notification
          // await this.firebaseService.sendNotification(
          //   admin.Contact.Id,
          //   notificationTitle,
          //   notificationMsg,
          //   {
          //     data: 'Opportunity data',
          //     type: 'Create opportunity',
          //   },
          // );
          // create SF notification
          await this.sfService.models.notifications.create(
            {
              Contact: admin.Contact.Id,
              Notification_By: opp[0].Listed_by,
              Created_at: new Date(),
              Event_type: opp[0].Category,
              Is_Read: false,
              Opportunity: opp[0].Id,
              Title: notificationMsg,
              Type: 'Opportunity Approval Request',
            },
            instituteId,
          );
          // await this.sfService.models.notifications.create({
          //   Contact: admin.Contact.Id,
          //   Notification_By: opp[0].Listed_by,
          //   Created_at: new Date(),
          //   Event_type: opp[0].Category,
          //   Is_Read: false,
          //   Opportunity: opp[0].Id,
          //   Title: notificationMsg,
          //   Type: 'Opportunity Review',
          // });
        });
      } else {
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `${opp[0].Name} opportunity rejected`;
        // create push notification
        // await this.firebaseService.sendNotification(
        //   opp[0].Listed_by,
        //   notificationTitle,
        //   notificationMsg,
        //   {
        //     data: 'Opportunity data',
        //     type: 'Create opportunity',
        //   },
        // );
        // create SF notification
        await this.sfService.models.notifications.create(
          {
            Contact: opp[0].Listed_by,
            Notification_By: userId,
            Created_at: new Date(),
            Event_type: opp[0].Category,
            Is_Read: false,
            Opportunity: opp[0].Id,
            Title: notificationMsg,
            Type: 'Opportunity Rejected',
          },
          instituteId,
        );
      }
    }

    if (!response.success) {
      throw new BadRequestException('Opportunity not updated');
    }

    return {
      statusCode: 200,
      message: `Opportunity ${status}ed.`,
    };
  }
  
}
