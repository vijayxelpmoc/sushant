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

  async getAdvisor(id: string, instituteId: string, programId: string) {
    const responseData: SFAdvisorContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Designation, Account_Name, Profile_Picture',
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
      Designation,
      Account_Name,
      Profile_Picture,
    } = responseData[0];

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

    const institute: AdvisorInstituteName[] | null =
      await this.sfService.models.accounts.get(
        'Id, Account_Name, program_logo',
        {
          Id: Institute_Id,
          // Program: programId,
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
    programId: string,
  ) {
    const responseData: SFAdvisorContact[] =
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
      throw new NotFoundException(`Advisor with #${id} not found`);
    }

    const updateObj: any = {};
    updateObj.Primary_Educational_Institution = programId;
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
    programId: string,
  ): Promise<any> {
    // notification details.
    const notification = await this.sfService.models.notifications.get(
      '*',
      {
        Id: notificationId,
        Program: programId,
      },
      {},
      instituteId,
    );
    console.log(notification);

    if(notification.length === 0){
      return new NotFoundException();
    }

    // select id based on notification type.
    let id = null;
    const type = notification[0].Type;
    // for mofification id will be.
    if (type === 'Opportunity Modification Request') {
      id = notification[0].Modification;
    }
    // for opportunity id will be.
    if (
      type === 'Opportunity Approval Request' ||
      type === 'Opportunity Removal Request'
    ) {
      id = notification[0].Opportunity;
    }

    const filteredData = [];
    // get opportunity details.
    const res = await this.sfService.models.accounts.get(
      '*,Listed_by.Name, Listed_by.Profile_Picture',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId,
    );
    console.log('res', res);

    if (res.length !== 0) {
      res.map((event) => {
        const filteredDataObject = {
          Id: event.Id,
          creatorName: event.Listed_by.Name,
          creatorProfilePic: event.Listed_by.Profile_Picture,
          createdAt: event.Created_at,
          eventName: event.Account_Name,
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
          type: type,
          Program: programId,
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
      // 'Id,Created_at,Account_Name,Phone,Category,Start_Date,Venue,End_Date,Description,Status, Opportunity_Id.Listed_by,Opportunity_Id.Listed_by.Name, Opportunity_Id.Listed_by.Profile_Picture',
      'Id,Created_at,Account_Name,Phone,Category,Start_Date,Venue,End_Date,Description,Status, Opportunity_Id.Listed_by',
      // 'Opportunity_Id.Listed_by, *',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId,
    );

    const user = await this.sfService.generics.contacts.get(
      'Name,Profile_Picture',
      {
        Id: mods[0].Opportunity_Id.Listed_by,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );
    console.log(user);
    
    console.log(mods);

    if (mods.length !== 0) {
      mods.map((event) => {
        const filteredDataObj = {
          Id: event.Id,
          creatorName: user
            ? user[0].Name
            : null,
          creatorProfilePic: user
            ? user[0].Profile_Picture
            : null,
          createdAt: event.Created_at,
          eventName: event.Account_Name,
          category: event.Category,
          phone: event.Phone,
          venue: event.Venue,
          startDate: event.Start_Date,
          endDate: event.End_Date,
          description: event.Description,
          approvalStatus: event.Status,
          type: notification && notification[0].Type,
          Program: programId,
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
  async getOpportunityApprovals(
    userId: string,
    role: string,
    instituteId: string,
    programId: string,
  ) {
    const opportunities = await this.sfService.models.accounts.get(
      '*,Listed_by.Profile_Picture,Listed_by.Name',
      {
        Approval_Status: 'AdvisorReview',
        Program: programId,
      },
      {},
      instituteId,
    );
    const approvalList = [];
    opportunities.map((opportunity) => {
      const dataObj = {
        Id: opportunity.Id,
        eventName: opportunity.Account_Name,
        creatorName: opportunity.Listed_by.Name,
        creatorProfilePic: opportunity.Listed_by.Profile_Picture,
        description: opportunity.Description,
        venue: opportunity.Venue,
        website: opportunity.Website,
        eventDate: opportunity.Start_Date,
        phone: opportunity.Phone,
        role: role,
        Type: opportunity.Category,
        approvalStatus: opportunity.Approval_Status,
        expirationDate: opportunity.End_Date,
        Program: programId,
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
    programId: string,
  ) {
    const requestedOpportunity = await this.sfService.models.accounts.get(
      '*',
      {
        Id: opportunityId,
        Program: programId,
      },
      {},
      instituteId,
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
          Program: programId,
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
            Organization: programId,
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
              Program: programId,
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
            Program: programId,
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
