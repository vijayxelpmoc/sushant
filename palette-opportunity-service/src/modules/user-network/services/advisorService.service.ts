import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  
  import { StudentResponse } from './types/advisor-interface';
  import {
    AdvisorBEResponse,
    AdvisorInstituteName,
    advisorStudentRelation,
    AdvisorStudents,
    AdvisorUpdateBEResponse,
    AdvisorUpdateResponse,
    SFAdvisorContact,
  } from './types/advisor-interface';
  import { UpdateSfAdvisorDto } from './Dtos/update-sfadvisor.dto';
  import {
    GuardianSubRoles,
    MentorSubRoles,
    Role,
  } from '../auth/decorator/role.enum';
  import { ParentStudentListSF } from 'src/parent/types/parent-interface';
  import { SFALlAccountFields } from 'src/salesforce/types/sf-interface';
  import { stat } from 'fs';
  import { UtilityService } from '../utility/utility.service';
import { SfService } from '@gowebknot/palette-salesforce-service';
  
  @Injectable()
  export class AdvisorService {
    constructor(
      private sfService: SfService,
      private utilityService: UtilityService,
    ) {}
  
    /** sends advisor details on the basis of the id
     *  @param {string} id - The id of the advisor
     * @returns {Object} AdvisorBEResponse Interface
     */
    async getAdvisor(id: string): Promise<AdvisorBEResponse> {
      const responseData: SFAdvisorContact[] = await this.sfService.getContact(
        'Id, Name,prod_uuid , dev_uuid, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, WebsiteTitle, Github, LinkedIn_URL, Designation, AccountId, Profile_Picture',
        {
          Id: id,
        },
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
        WebsiteTitle,
        Github,
        LinkedIn_URL,
        Designation,
        AccountId,
        Profile_Picture,
      } = responseData[0];
  
      if (!responseData) {
        throw new NotFoundException(`Advisor with ID "${id}" not found`);
      }
      const getInstitute = await this.sfService.getAffiliation(
        'Account',
        {
          Contact: id,
          // Role: 'Advisor',
        },
      );
  
      const Institute_Id = getInstitute[0].Account; // Real Institute Id
  
      const institute:
        | AdvisorInstituteName[]
        | null = await this.sfService.getAccount('Id, Name,program_logo', {
        Id: Institute_Id,
      });
  
      // const instituteName: string | null =
      //   institute === null ? null : institute.map(c => c.Name).toString();
  
      const advisorData: AdvisorBEResponse = {
        Id: Id,
        name: Name,
        firebase_uuid:
          process.env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
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
        website_Title: WebsiteTitle,
        github_link: Github,
        linkedin_link: LinkedIn_URL,
      };
  
      return advisorData;
    }
  
    /**
     * Function to get the details of the advisor by ID
     * @param advisorId id of the advisor
     * object Array of advisor details
     */
    async advisorDetailsDashboard(advisorId: string): Promise<AdvisorBEResponse> {
      const userDetails: AdvisorBEResponse = await this.getAdvisor(advisorId);
      const response: AdvisorBEResponse = userDetails;
      return response;
    }
  
    async update(
      id: number,
      updateSfAdvisorDto: UpdateSfAdvisorDto,
    ): Promise<AdvisorUpdateBEResponse> {
      const responseData: SFAdvisorContact[] = await this.sfService.getContact(
        'Id, Name, Phone, Palette_Email, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook, Whatsapp, Instagram, Website, WebsiteTitle, Github, LinkedIn_URL, Designation, AccountId',
        {
          Id: id,
        },
      );
  
      if (!responseData) {
        throw new NotFoundException(`Advisor with #${id} not found`);
      }
  
      const { Id } = responseData[0];
  
      const updateObj: any = {};
  
      //checking the input from dtos and updating
      if (updateSfAdvisorDto.hasOwnProperty('facebook_link')) {
        const { facebook_link } = updateSfAdvisorDto;
        updateObj.Facebook = facebook_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('whatsapp_link')) {
        const { whatsapp_link } = updateSfAdvisorDto;
        updateObj.Whatsapp = whatsapp_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('instagram_link')) {
        const { instagram_link } = updateSfAdvisorDto;
        updateObj.Instagram = instagram_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('github_link')) {
        const { github_link } = updateSfAdvisorDto;
        updateObj.Github = github_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('linkedin_link')) {
        const { linkedin_link } = updateSfAdvisorDto;
        updateObj.LinkedIn_URL = linkedin_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('website_link')) {
        const { website_link } = updateSfAdvisorDto;
        updateObj.Website = website_link;
      }
  
      if (updateSfAdvisorDto.hasOwnProperty('website_Title')) {
        const { website_Title } = updateSfAdvisorDto;
        updateObj.WebsiteTitle = website_Title;
      }
  
      const updateUser: AdvisorUpdateResponse = await this.sfService.updateContact(
        Id,
        updateObj,
      );
      if (updateUser.id && updateUser.success) {
        return { status: 200, message: 'Saved Successfully' };
      } else {
        throw new BadRequestException(
          'Exception occured unable save the changes',
        );
      }
    }
  
    /** Retrieve all the students of a advisor
     *  @param {string} userId - The id of the mentor
     * @returns {Object} student details of the advisor
     */
    async getAdvisorDetailsStudents(mentorId: string): Promise<AdvisorStudents> {
      const filteredStudents = await this.getFilteredStudents(mentorId);
      const advisor = await this.getAdvisor(mentorId);
      return {
        statusCode: 200,
        data: { mentor: advisor, students: filteredStudents },
      };
    }
  
    // getting all students from relationship table with relationship type mentor and id of the mentor with the current mentor
    async getFilteredStudents(mentorId: string): Promise<StudentResponse[]> {
      const students: advisorStudentRelation[] = await this.sfService.getRelationship(
        'Id, Name, Contact, Contact.Name, Contact.Grade, Related_Contact.Id, Related_Contact.Name, Type, Related_Contact.Primary_Educational_Institution, Related_Contact.Profile_Picture, Related_Contact.IsRegisteredOnPalette, Related_Contact.Is_Deactive',
        {
          Contact: mentorId,
          Type: MentorSubRoles, // Mentor ==> Advisor
        },
      );
  
      // if (students.length === 0) {
      //   throw new NotFoundException('NO STUDENTS FOUND');
      // }
  
      // filtering data
      const filteredStudents = [];
      students.map(c => {
        if (c.Related_Contact.Is_Deactive === false) {
          const filteredObj = {
            Id: c.Related_Contact.Id,
            name: c.Related_Contact.Name,
            grade: c.Related_Contact.Grade || null,
            profilePicture: c.Related_Contact.Profile_Picture || null,
            institute:
              c.Related_Contact.Primary_Educational_Institution || null,
            isRegistered: c.Related_Contact.IsRegisteredOnPalette,
          };
          filteredStudents.push(filteredObj);
        }
      });
  
      return filteredStudents;
    }
  
    // Opportunity Approvals
    async getOpportunityApprovals(userId: string) {
      const opportunities = await this.sfService.getAccount('*', {
        Approval_Status: 'AdvisorReview',
        // Removal_Status: null || 'Rejected',
      });
      const approvalList = [];
      opportunities.map(opportunity => {
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
    ) {
      const requestedOpportunity = (await this.sfService.getAccount('*', {
        Id: opportunityId,
      }))[0];
  
      if (!requestedOpportunity) {
        throw new NotFoundException('Opportunity not found');
      }
  
      const response = await this.sfService.updateAccount(opportunityId, {
        Approval_Status: status,
      });
      let notificationTitle = ``;
      let notificationMsg = ``;
      if (response['success'] === true) {
        const opp = await this.sfService.getAccount('*', {
          Id: opportunityId,
        });
        if (status === 'In Review') {
          const insId = opp[0].ParentId;
          // fetch admin
          const admins = await this.sfService.getAffiliation(
            'Contact.Id',
            {
              Account: insId,
              Role: 'Admin',
            },
          );
          notificationTitle = `Opportunity ${opp[0].Name}`;
          notificationMsg = `${opp[0].Name} opportunity requested for approval`;
          admins.map(async admin => {
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
            await this.sfService.createNotification({
              Contact: admin.Contact.Id,
              Notification_By: opp[0].Listed_by,
              Created_at: new Date(),
              Event_type: opp[0].Category,
              Is_Read: false,
              Opportunity: opp[0].Id,
              Title: notificationMsg,
              Type: 'Opportunity Approval Request',
            });
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
          await this.sfService.createNotification({
            Contact: opp[0].Listed_by,
            Notification_By: userId,
            Created_at: new Date(),
            Event_type: opp[0].Category,
            Is_Read: false,
            Opportunity: opp[0].Id,
            Title: notificationMsg,
            Type: 'Opportunity Approval Request',
          });
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
  
    async getOpportunityDetail(id: string) {
      const opportunity = await this.sfService.getAccount('*', {
        Id: id,
      });
  
      const mods = await this.sfService.getModifications(
        'Opportunity_Id.Listed_by.Name, Opportunity_Id.Listed_by.Profile_Picture, Opportunity_Id.Listed_by, *',
        {
          Id: id,
        },
      );
  
      const filteredData = [];
      if (mods.length !== 0) {
        // extracting fetched data
        mods.map(event => {
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
          };
          filteredData.push(filteredDataObj);
        });
      }
      if (opportunity.length !== 0) {
        // extracting fetched data
        opportunity.map(event => {
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
          };
          filteredData.push(filteredDataObject);
        });
      }
      if (filteredData.length === 0) {
        throw new NotFoundException('NotFound');
      } else {
        return {
          statusCode: 200,
          message: 'In-ReviewOpportunityDetail',
          data: filteredData,
        };
      }
    }
  }
  