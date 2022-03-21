import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  AdminBEResponse,
  InstituteDetailsResponse,
  AdminUpdateBEResponse,
  AdminUpdateResponse,
  MentorParentResponse,
  SFAdminContact,
  SFInstitute,
  SFMentors,
  SFStudents,
  StudentResponse,
  SFAdmins,
  StudentConnectionResponseSF,
  ObserverParentResponse,
  ApprovalsTodoResponse,
  ApprovalTodoResponse,
  AdminInstituteName,
  AdminData,
} from './types/admin-interface';
import { UpdateSfAdminDto } from './dtos/update-sfadmin.dto';
import { SfService } from '@wrapper/services/sf.service';
import { Notifier } from '@wrapper/notifiers';
import { GuardianObserverSubRoles, NotificationType } from '@src/wrapper/types';
import { BasicResponse } from './types/login-interface';
import { Errors, Responses } from '@src/constants';

@Injectable()
export class AdminService {
  constructor(private sfService: SfService, private notifier: Notifier) {}

  /** sends admin details on the basis of the id
   *  @param {string} id - The id of the admin
   * @returns {Object} AdminBEResponse Interface
   */
  async getAdmin(id: string): Promise<AdminBEResponse> {
    const responseData: SFAdminContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, Phone, Palette_Email__c, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook__c, Whatsapp__c, Instagram__c, Website__c, WebsiteTitle__c, Github__c, LinkedIn_URL__c, Designation__c, AccountId, Profile_Picture__c',
        {
          Id: id,
        },
      );
    const {
      Id,
      Name,
      Phone,
      Palette_Email__c,
      MailingCity,
      MailingCountry,
      MailingState,
      MailingPostalCode,
      MailingStreet,
      Facebook__c,
      Whatsapp__c,
      Instagram__c,
      Website__c,
      WebsiteTitle__c,
      Github__c,
      LinkedIn_URL__c,
      Designation__c,
      AccountId,
      Profile_Picture__c,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`Admin with ID "${id}" not found`);
    }

    const institute: AdminInstituteName[] | null =
      await this.sfService.models.accounts.get('Id, Name,program_logo__c', {
        Id: AccountId,
      });

    // const institute_Name:
    //   | AdminInstituteName[]
    //   | null = await this.sfService.getAccount('Name', {
    //   Id: AccountId,
    // });

    // const instituteName: string | null =
    //   institute_Name === null
    //     ? null
    //     : institute_Name.map(c => c.Name).toString();

    // const instituteName = await this.sfService.getAffiliation(
    //   'hed__Account__c, hed__Account__r.Name',
    //   {
    //     hed__Contact__c: id,
    //     hed__Affiliation_Type__c: 'Educational Institution',
    //   },
    // );

    // const institute_Name: string | null =
    //   instituteName[0].hed__Account__r.Name || null;

    const adminData: AdminData = {
      Id: Id,
      name: Name,
      phone: Phone,
      email: Palette_Email__c,
      profilePicture: Profile_Picture__c,
      instituteId: institute[0].Id,
      instituteLogo: institute[0].program_logo__c,
      institute_name: institute[0].Name,
      designation: Designation__c,
      mailingCity: MailingCity,
      mailingCountry: MailingCountry,
      mailingState: MailingState,
      mailingStreet: MailingStreet,
      mailingPostalCode: MailingPostalCode,
      facebook_link: Facebook__c,
      whatsapp_link: Whatsapp__c,
      instagram_link: Instagram__c,
      website_link: Website__c,
      website_Title: WebsiteTitle__c,
      github_link: Github__c,
      linkedin_link: LinkedIn_URL__c,
    };

    return {
      statusCode: 200,
      message: Responses.ADMIN_DATA_FETCH_SUCCESS,
      data: adminData,
    };
  }

  /**
   * Function to get the details of the admin by ID
   * @param adminId id of the admin
   * object Array of admin details
   */
  async adminDetailsDashboard(adminId: string): Promise<AdminBEResponse> {
    return await this.getAdmin(adminId);
  }

  /** updates admin profile details
   *  @param {UpdateSfAdminDto} updateSfAdminDto - contains all the attributes that needs to be updated
   * @returns {Object} status code and message
   */
  async update(
    id: string,
    updateSfAdminDto: UpdateSfAdminDto,
  ): Promise<AdminUpdateBEResponse> {
    const responseData: SFAdminContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, Phone, Palette_Email__c, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook__c, Whatsapp__c, Instagram__c, Website__c, WebsiteTitle__c, Github__c, LinkedIn_URL__c, Designation__c, AccountId',
        {
          Id: id,
        },
      );
    const { Id } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
    }
    const updateObj: any = {};

    if (updateSfAdminDto.hasOwnProperty('facebook_link')) {
      const { facebook_link } = updateSfAdminDto;
      updateObj.Facebook__c = facebook_link;
    }

    if (updateSfAdminDto.hasOwnProperty('whatsapp_link')) {
      const { whatsapp_link } = updateSfAdminDto;
      updateObj.Whatsapp__c = whatsapp_link;
    }

    if (updateSfAdminDto.hasOwnProperty('instagram_link')) {
      const { instagram_link } = updateSfAdminDto;
      updateObj.Instagram__c = instagram_link;
    }

    if (updateSfAdminDto.hasOwnProperty('github_link')) {
      const { github_link } = updateSfAdminDto;
      updateObj.Github__c = github_link;
    }

    if (updateSfAdminDto.hasOwnProperty('linkedin_link')) {
      const { linkedin_link } = updateSfAdminDto;
      updateObj.LinkedIn_URL__c = linkedin_link;
    }

    if (updateSfAdminDto.hasOwnProperty('website_link')) {
      const { website_link } = updateSfAdminDto;
      updateObj.Website__c = website_link;
    }

    if (updateSfAdminDto.hasOwnProperty('website_Title')) {
      const { website_Title } = updateSfAdminDto;
      updateObj.WebsiteTitle__c = website_Title;
    }

    const updateUser: AdminUpdateResponse =
      await this.sfService.generics.contacts.update(Id, updateObj);

    if (updateUser.id && updateUser.success) {
      return { statusCode: 200, message: Responses.SAVED };
    } else {
      throw new BadRequestException(Errors.SAVE_FAILED);
    }
  }

  /** Gets admin details (all the user that are inside the institute - students, mentors)
   *  @param {userId} string - admin id
   * @returns {Object} students and mentors that are inside the same institute as admin
   */
  async getAdminInstituteDetails(
    userId: string,
  ): Promise<InstituteDetailsResponse> {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const institute: SFInstitute[] =
      await this.sfService.models.affiliations.get(
        'Id, Name,  hed__Account__c, hed__Account__r.Name',
        {
          hed__Contact__c: userId,
          hed__Role__c: 'Admin',
        },
      );

    if (institute.length === 0) {
      throw new BadRequestException(Errors.NO_INSTITUTION_ASSIGNED_TO_ADMIN);
    }

    // getting all the admin inside the institute
    const Admins: SFAdmins[] = await this.sfService.models.affiliations.get(
      'hed__Contact__c, hed__Contact__r.Name, hed__Role__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Admin',
      },
    );

    Admins.map((admin) => {
      // checking this to exclude the user that are deactivated
      // and also excluding the user requesting
      if (
        admin.hed__Contact__c !== userId &&
        admin.hed__Contact__r.Is_Deactive__c === false
      ) {
        const adminObj = {
          Id: admin.hed__Contact__c,
          name: admin.hed__Contact__r.Name,
          profilePicture: admin.hed__Contact__r.Profile_Picture__c || null,
          isRegistered: admin.hed__Contact__r.IsRegisteredOnPalette__c,
        };
        filteredAdmins.push(adminObj);
      }
    });

    // getting all the students inside the institute
    const students: SFStudents[] = await this.sfService.generics.contacts.get(
      'Id, Name, Grade__c, Primary_Educational_Institution__r.Name, Profile_Picture__c, Is_Deactive__c',
      {
        Primary_Educational_Institution__c: institute[0].hed__Account__c,
      },
    );

    // getting all the mentors inside the institute
    const mentors: SFMentors[] = await this.sfService.models.affiliations.get(
      'Id, Name,  hed__Account__c, hed__Affiliation_Type__c, hed__Contact__c, hed__Description__c, hed__Role__c, hed__Contact__r.Id, hed__Contact__r.Name, hed__Contact__r.Designation__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Palette_Email__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Advisor',
      },
    );

    // filtering the data
    const filteredStudents: StudentResponse[] = [];
    if (students.length > 0) {
      students.map((student) => {
        // checking this to exclude the user that are deactivated
        if (student.Is_Deactive__c === false) {
          const filteredObj = {
            Id: student.Id,
            name: student.Name,
            profilePicture: student.Profile_Picture__c,
            institute: student.Primary_Educational_Institution__r
              ? student.Primary_Educational_Institution__r.Name
              : null,
            grade: student.Grade__c,
          };
          filteredStudents.push(filteredObj);
          studentIds.push(student.Id);
        }
      });
    }

    const filteredMentor: MentorParentResponse[] = [];
    if (mentors.length > 0) {
      mentors.map((mentor) => {
        // checking this to exclude the user that are deactivated
        if (
          mentor.hed__Contact__r &&
          mentor.hed__Contact__r.Is_Deactive__c === false
        ) {
          const filteredObj = {
            Id: mentor.hed__Contact__r.Id,
            name: mentor.hed__Contact__r.Name,
            profilePicture: mentor.hed__Contact__r.Profile_Picture__c,
            instituteName: institute[0].hed__Account__r.Name,
            designation: mentor.hed__Contact__r.Designation__c,
            isRegistered: mentor.hed__Contact__r.IsRegisteredOnPalette__c,
          };
          filteredMentor.push(filteredObj);
        }
      });
    }

    // getting all the guardians of the students
    const studentConnection: StudentConnectionResponseSF[] =
      await this.sfService.models.relationships.get(
        'hed__Contact__r.Primary_Educational_Institution__c, hed__RelatedContact__c, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Name, hed__RelatedContact__r.Palette_Email__c, hed__Type__c, hed__RelatedContact__r.Is_Deactive__c',
        {
          hed__Contact__c: studentIds,
          hed__Type__c: GuardianObserverSubRoles,
        },
      );

    const filteredParent: MentorParentResponse[] = [];
    const filteredObserver: ObserverParentResponse[] = [];

    if (studentConnection.length > 0) {
      studentConnection.map((user) => {
        // checking this to exclude the user that are deactivated
        if (user.hed__RelatedContact__r.Is_Deactive__c === false) {
          const filteredObj = {
            Id: user.hed__RelatedContact__c,
            name: user.hed__RelatedContact__r.Name,
            profilePicture: user.hed__RelatedContact__r.Profile_Picture__c,
            instituteName: institute[0].hed__Account__r.Name,
            designation: user.hed__Contact__r.Designation__c,
          };
          if (user.hed__Type__c === 'Observer')
            filteredObserver.push(filteredObj);
          if (user.hed__Type__c === 'Guardian')
            filteredParent.push(filteredObj);
        }
      });
    }

    // removing duplicates
    const uniqueParents: MentorParentResponse[] = filteredParent.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    const uniqueObserver: ObserverParentResponse[] = filteredObserver.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    return {
      statusCode: 200,
      data: {
        students: filteredStudents,
        mentors: filteredMentor,
        parents: uniqueParents,
        observers: uniqueObserver,
        admins: filteredAdmins,
      },
    };
  }

  // /** gets all In Review opportunities
  //  *  @returns {Object} status code and message and list opportunity information
  //  */
  // async getOpportunity(): Promise<ApprovalsDataResponse> {
  //   // fetching data
  //   const res = await this.sfService.models. accounts.get(
  //     'Listed_by__r.Name, Listed_by__r.Profile_Picture__c, *',
  //     {
  //       // Record_Type_Name__c: 'activities',
  //       opportunityScope__c: 'Global',
  //       Visibility__c: 'Available',
  //       Approval_Status__c: 'In Review',
  //     },
  //   );
  //   const filteredData = [];
  //   // extracting fetched data
  //   if (res.length > 0) {
  //     res.map(event => {
  //       const filterDataObj = {
  //         Id: event.Id,
  //         creatorName: event.Listed_by__r.Name,
  //         creatorProfilePic: event.Listed_by__r.Profile_Picture__c,
  //         createdAt: event.Created_at__c,
  //         requestType: 'Opportunity Approval Request',
  //         eventName: event.Name,
  //       };
  //       filteredData.push(filterDataObj);
  //     });
  //   }

  //   const mods = await this.sfService.models. modifications.gets(
  //     'Opportunity_Id__r.Listed_by__r.Name, Opportunity_Id__r.Listed_by__r.Profile_Picture__c, Opportunity_Id__r.Listed_by__c, *',
  //     {},
  //   );
  //   if (mods.length > 0) {
  //     // extracting fetched data
  //     mods.map(event => {
  //       const filterDataObj = {
  //         Id: event.Id,
  //         creatorName: event.Opportunity_Id__c
  //           ? event.Opportunity_Id__r.Listed_by__r.Name
  //           : null,
  //         creatorProfilePic: event.Opportunity_Id__c
  //           ? event.Opportunity_Id__r.Listed_by__r.Profile_Picture__c
  //           : null,
  //         createdAt: event.Created_at__c,
  //         requestType: 'Opportunity Modification Request',
  //         eventName: event.Name,
  //       };
  //       filteredData.push(filterDataObj);
  //     });
  //   }

  //   if (filteredData.length === 0) {
  //     throw new NotFoundException('NoRecordsFound');
  //   } else {
  //     return {
  //       statusCode: 200,
  //       message: 'Success',
  //       data: filteredData,
  //     };
  //   }
  // }

  /** gets In-Review opportunity detail
   *  @param {id} string opportunity id
   *  @returns {Object} status code and message and opportunity information
   */
  async getOpportunityDetail(notificationId): Promise<any> {
    const notification = await this.sfService.models.notifications.get('*', {
      Id: notificationId,
    });
    let id = null;
    const type = notification[0].Type__c;
    if (notification[0].Type__c === 'Opportunity Modification Request') {
      id = notification[0].Modification__c;
    }
    if (
      notification[0].Type__c === 'Opportunity Approval Request' ||
      notification[0].Type__c === 'Opportunity Removal Request'
    ) {
      id = notification[0].Opportunity__c;
    }
    const filteredData = [];
    const res = await this.sfService.models.accounts.get(
      'Listed_by__r.Name, Listed_by__r.Profile_Picture__c, *',
      {
        Id: id,
      },
    );
    if (res.length !== 0) {
      // extracting fetched data
      res.map((event) => {
        const filteredDataObject = {
          Id: event.Id,
          creatorName: event.Listed_by__r.Name,
          creatorProfilePic: event.Listed_by__r.Profile_Picture__c,
          createdAt: event.Created_at__c,
          eventName: event.Name,
          category: event.Category__c,
          phone: event.Phone,
          venue: event.Venue__c,
          startDate: event.Start_Date__c,
          endDate: event.End_Date__c,
          description: event.Description,
          approvalStatus:
            type === 'Opportunity Removal Request'
              ? event.Removal_Status__c
              : event.Approval_Status__c,
          type: notification[0].Type__c,
        };
        filteredData.push(filteredDataObject);
      });
    }
    const mods = await this.sfService.models.modifications.get(
      'Opportunity_Id__r.Listed_by__r.Name, Opportunity_Id__r.Listed_by__r.Profile_Picture__c, Opportunity_Id__r.Listed_by__c, *',
      {
        Id: id,
      },
    );
    if (mods.length !== 0) {
      // extracting fetched data
      mods.map((event) => {
        const filteredDataObj = {
          Id: event.Id,
          creatorName: event.Opportunity_Id__c
            ? event.Opportunity_Id__r.Listed_by__r.Name
            : null,
          creatorProfilePic: event.Opportunity_Id__c
            ? event.Opportunity_Id__r.Listed_by__r.Profile_Picture__c
            : null,
          createdAt: event.Created_at__c,
          eventName: event.Account_Name__c,
          category: event.Cate__c,
          phone: event.Phone__c,
          venue: event.Venue__c,
          startDate: event.Start_Date__c,
          endDate: event.End_Date__c,
          description: event.Description__c,
          approvalStatus: event.Status__c,
          type: notification[0].Type__c,
        };
        filteredData.push(filteredDataObj);
      });
    }
    if (filteredData.length === 0) {
      throw new NotFoundException();
    } else {
      return {
        statusCode: 200,
        message: Responses.IN_REVIEW_OPPORTUNITY_DETAILS_SUCCESS,
        data: filteredData,
      };
    }
  }

  /** approves the opportunity
   *  @param {id} string opportunity id
   */
  async approvalStatus(
    id: string,
    type: string,
    userId: string,
  ): Promise<BasicResponse> {
    let notificationTitle = ``;
    let notificationMsg = ``;
    if (
      type === 'Opportunity Approval Request' ||
      type === 'Opportunity Removal Request'
    ) {
      const opp = await this.sfService.models.accounts.get('*', { Id: id });
      if (opp.length !== 0) {
        // updates status to approved
        if (type === 'Opportunity Approval Request') {
          if (opp[0].Approval_Status__c === 'Approved') {
            return {
              statusCode: 200,
              message: Errors.ALREADY_APPROVED,
            };
          }

          await this.sfService.models.accounts.update(
            {
              Approval_Status__c: 'Approved',
              Status_At__c: new Date(),
            },
            id,
          );
          notificationTitle = `Opportunity ${opp[0].Name}`;
          notificationMsg = `Opportunity ${opp[0].Name} approved`;
          // push notification
          const notificationConfig = {
            userId: opp[0].Listed_by__c,
            title: notificationTitle,
            body: notificationMsg,
            notificationId: uuidv4(),
            notificationData: {
              data: 'opportunity approval request',
              type: 'opportunity approval request',
            },
          };
          await this.notifier.send(NotificationType.PUSH, notificationConfig);
          // create notification for creator
          await this.sfService.models.notifications.create({
            Title__c: notificationMsg,
            Contact__c: opp[0].Listed_by__c,
            Opportunity__c: id,
            Type__c: 'Opportunity Approval Request',
            Notification_By__c: userId,
            Created_at__c: new Date(),
            Is_Read__c: false,
          });
          return {
            statusCode: 200,
            message: Responses.APPROVED,
          };
        }
        if (type === 'Opportunity Removal Request') {
          await this.sfService.models.accounts.update(
            {
              Visibility__c: 'Removed',
              Removal_Status__c: 'Approved',
              Removal_at__c: new Date(),
              Modification__c: null,
              Modification_Status__c: null,
              // Approval_Status__c: 'Rejected',
              // Status_At__c: new Date(),
            },
            id,
          );
          notificationTitle = `Opportunity ${opp[0].Name}`;
          notificationMsg = `Opportunity ${opp[0].Name} removal approved.`;
          // Push Notification
          const notificationConfig = {
            userId: opp[0].Listed_by__c,
            title: notificationTitle,
            body: notificationMsg,
            notificationId: uuidv4(),
            notificationData: {
              data: 'opportunity removal request',
              type: 'opportunity removal request',
            },
          };
          await this.notifier.send(NotificationType.PUSH, notificationConfig);

          // create notification for creator
          await this.sfService.models.notifications.create({
            Title__c: notificationMsg,
            Contact__c: opp[0].Listed_by__c,
            Opportunity__c: id,
            Type__c: 'Opportunity Removed',
            Notification_By__c: userId,
            Created_at__c: new Date(),
            Is_Read__c: false,
          });
          // get considerations
          const recommendations =
            await this.sfService.models.recommendations.get('Id, Assignee__c', {
              Event__c: id,
            });
          // const reccIds = [];
          if (recommendations.length > 0) {
            recommendations.map(async (rec) => {
              // reccIds.push(rec.Id);
              await this.sfService.models.notifications.create({
                Title__c: `${opp[0].Name} removed`,
                Contact__c: rec.Assignee__c,
                Opportunity__c: id,
                Type__c: 'Opportunity Removed',
                Notification_By__c: userId,
                Created_at__c: new Date(),
                Is_Read__c: false,
              });
            });
          }
          // get todos
          const todos = await this.sfService.models.activities.get(
            'Id, Contact__c',
            {
              Event__c: id,
            },
          );
          const todoActivityIds = [];
          if (todos.length > 0) {
            todos.map(async (todo) => {
              todoActivityIds.push(todo.Id);
              await this.sfService.models.notifications.create({
                Title__c: `${opp[0].Name} removed`,
                Contact__c: todo.Contact__c,
                Opportunity__c: id,
                Type__c: 'Opportunity Removal Request',
                Notification_By__c: userId,
                Created_at__c: new Date(),
                Is_Read__c: false,
              });
            });
            await this.sfService.models.activities.delete(todoActivityIds);
          }
          return { statusCode: 200, message: Responses.APPROVED };
        }
      }
    }
    if (type === 'Opportunity Modification Request') {
      const mods = await this.sfService.models.modifications.get('*', {
        Id: id,
      });
      if (mods.length !== 0) {
        const opp = await this.sfService.models.accounts.get(
          'Name, Listed_by__c',
          {
            Id: mods[0]['Opportunity_Id__c'],
          },
        );
        const modsData = {
          Name: mods[0]['Account_Name__c'],
          Phone: mods[0]['Phone__c'],
          Category__c: mods[0]['Cate__c'],
          Description: mods[0]['Description__c'],
          End_Date__c: mods[0]['End_Date__c'],
          Start_Date__c: mods[0]['Start_Date__c'],
          Venue__c: mods[0]['Venue__c'],
          Website: mods[0]['Website__c'],
          Modification_Status__c: 'Approved',
          Modification__c: null,
        };
        await this.sfService.models.accounts.update(
          mods[0]['Opportunity_Id__c'],
          modsData,
        );
        // const allmods = await this.sfService.models. modifications.get('Id', {
        //   Opportunity_Id__c: mods[0]['Opportunity_Id__c'],
        // });
        // // making all other modification req as invalid
        // allmods.map(async data => {
        //   if (data.Id === id) {
        //     await this.sfService.updateModification(data.Id, {
        //       Status__c: 'Approved',
        //       Valid__c: true,
        //     });
        //   } else {
        //     await this.sfService.updateModification(data.Id, {
        //       Valid__c: false,
        //     });
        //   }
        // });
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} modification request approved.`;
        // Push Notification
        const notificationConfig = {
          userId: opp[0].Listed_by__c,
          title: notificationTitle,
          body: notificationMsg,
          notificationId: uuidv4(),
          notificationData: {
            data: 'opportunity modification request',
            type: 'opportunity modification request',
          },
        };
        await this.notifier.send(NotificationType.PUSH, notificationConfig);
        // create notification for creator
        await this.sfService.models.notifications.create({
          Title__c: notificationMsg,
          Contact__c: opp[0]['Listed_by__c'],
          Opportunity__c: mods[0]['Opportunity_Id__c'],
          Modification__c: id,
          Type__c: 'Opportunity Modified',
          Notification_By__c: userId,
          Created_at__c: new Date(),
          Is_Read__c: false,
        });
        const recc = await this.sfService.models.recommendations.get(
          'Id, Assignee__c',
          {
            Event__c: mods[0]['Opportunity_Id__c'],
          },
        );
        if (recc.length !== 0) {
          recc.map(async (rec) => {
            // create notification for assignees
            await this.sfService.models.notifications.create({
              Title__c: `consideration ${opp[0].Name} opportunity updated`,
              Contact__c: rec.Assignee__c,
              Opportunity__c: mods[0]['Opportunity_Id__c'],
              Type__c: 'Opportunity Modified',
              Notification_By__c: userId,
              Created_at__c: new Date(),
              Is_Read__c: false,
            });
          });
        }
        const todos = await this.sfService.models.activities.get(
          'Id, Contact__c',
          {
            Event__c: mods[0]['Opportunity_Id__c'],
          },
        );
        if (todos.length !== 0) {
          todos.map(async (todo) => {
            // create notification for assignees
            await this.sfService.models.notifications.create({
              Title__c: `Todo ${opp[0].Name} opportunity updated`,
              Contact__c: todo.Contact__c,
              Opportunity__c: mods[0]['Opportunity_Id__c'],
              Type__c: 'Opportunity Modified',
              Notification_By__c: userId,
              Created_at__c: new Date(),
              Is_Read__c: false,
            });
          });
        }
        return { statusCode: 200, message: Responses.APPROVED };
      }
    }
    throw new BadRequestException(Errors.FAILURE);
  }

  /** rejects the opportunity
   *  @param {id} string opportunity id
   */
  async rejectOpportunity(
    id: string,
    type: string,
    userId: string,
  ): Promise<BasicResponse> {
    let notificationTitle = ``;
    let notificationMsg = ``;
    if (
      type === 'Opportunity Approval Request' ||
      type === 'Opportunity Removal Request'
    ) {
      const opp = await this.sfService.models.accounts.get('*', { Id: id });
      if (opp.length !== 0) {
        if (type === 'Opportunity Approval Request') {
          if (opp[0].Approval_Status__c === 'Rejected') {
            return {
              statusCode: 200,
              message: Errors.ALREADY_REJECTED,
            };
          }

          // updates status to rejected
          await this.sfService.models.accounts.update(
            {
              Approval_Status__c: 'Rejected',
              Status_At__c: new Date(),
            },
            id,
          );

          notificationTitle = `Opportunity ${opp[0].Name}`;
          notificationMsg = `Opportunity ${opp[0].Name} approval request rejected`;
          // push notification
          const notificationConfig = {
            userId: opp[0].Listed_by__c,
            title: notificationTitle,
            body: notificationMsg,
            notificationId: uuidv4(),
            notificationData: {
              data: 'opportunity approval request',
              type: 'opportunity approval request',
            },
          };
          await this.notifier.send(NotificationType.PUSH, notificationConfig);
          // create notification for creator
          await this.sfService.models.notifications.create({
            Title__c: notificationMsg,
            Contact__c: opp[0].Listed_by__c,
            Opportunity__c: id,
            Type__c: 'Opportunity Approval Request',
            Notification_By__c: userId,
            Created_at__c: new Date(),
            Is_Read__c: false,
          });
        }
        if (type === 'Opportunity Removal Request') {
          await this.sfService.models.accounts.update(
            {
              Removal_Status__c: 'Not Approved',
              Removal_at__c: new Date(),
              // Approval_Status__c: 'Rejected',
              // Status_At__c: new Date(),
            },
            id,
          );
          notificationTitle = `Opportunity ${opp[0].Name}`;
          notificationMsg = `Opportunity ${opp[0].Name} removal request is rejected`;
          // Push Notification
          const notificationConfig = {
            userId: opp[0].Listed_by__c,
            title: notificationTitle,
            body: notificationMsg,
            notificationId: uuidv4(),
            notificationData: {
              data: 'opportunity removal request',
              type: 'opportunity removal request',
            },
          };
          await this.notifier.send(NotificationType.PUSH, notificationConfig);
          // create notification for creator
          await this.sfService.models.notifications.create({
            Title__c: notificationMsg,
            Contact__c: opp[0].Listed_by__c,
            Opportunity__c: id,
            Type__c: 'Opportunity Removal Request',
            Notification_By__c: userId,
            Created_at__c: new Date(),
            Is_Read__c: false,
          });
        }
        return { statusCode: 200, message: Responses.REJECTED };
      }
    }
    if (type === 'Opportunity Modification Request') {
      const mods = await this.sfService.models.modifications.gets('*', {
        Id: id,
      });
      if (mods.length !== 0) {
        const modsData = {
          Modification_Status__c: 'Rejected',
          Modification__c: null,
        };
        await this.sfService.models.accounts.update(
          modsData,
          mods[0]['Opportunity_Id__c'],
        );
        const opp = await this.sfService.models.accounts.get(
          'Name, Listed_by__c',
          {
            Id: mods[0]['Opportunity_Id__c'],
          },
        );
        const allModificationIds =
          await this.sfService.models.modifications.get('Id', {
            Opportunity_Id__c: mods[0]['Opportunity_Id__c'],
          });
        allModificationIds.map(async (data) => {
          await this.sfService.models.modifications.update(
            {
              Status__c: 'Rejected',
              // Valid__c: false,
            },
            data.Id,
          );
        });
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} modification request is rejected`;
        // Push Notification
        const notificationConfig = {
          userId: opp[0].Listed_by__c,
          title: notificationTitle,
          body: notificationMsg,
          notificationId: uuidv4(),
          notificationData: {
            data: 'opportunity modification request',
            type: 'opportunity modification request',
          },
        };
        await this.notifier.send(NotificationType.PUSH, notificationConfig);
        // create notification for creator
        await this.sfService.models.notifications.create({
          Title__c: notificationMsg,
          Contact__c: opp[0]['Listed_by__c'],
          Opportunity__c: mods[0]['Opportunity_Id__c'],
          Modification__c: id,
          Type__c: 'Opportunity Modification Request',
          Notification_By__c: userId,
          Created_at__c: new Date(),
          Is_Read__c: false,
        });
        return { statusCode: 200, message: Responses.REJECTED };
      }
    }
    throw new BadRequestException(Errors.FAILURE);
  }

  // Global Todo

  async getTodos(): Promise<ApprovalsTodoResponse> {
    const res = await this.sfService.models.todos.get('*', {
      Status__c: 'In Review',
      Todo_Scope__c: 'Global',
    });

    if (res.length === 0) {
      throw new NotFoundException();
    }

    const filteredData = [];
    res.map((todo: any) => {
      filteredData.push({
        id: todo.Id,
        name: todo.Name,
        description: todo.Description__c,
        taskStatus: todo.Task_status__c,
        type: todo.Type__c,
        completeBy: todo.Complete_By__c,
        listedBy: todo.Listed_by__c,
        eventAt: todo.Event_At__c || null,
        eventVenue: todo.Event_Venue__c || null,
        approvalStatus: todo.Status__c,
        instituteId: todo.ParentId__c,
      });
    });

    return {
      statusCode: 200,
      message: Responses.ALL_IN_REVIEW_TODOS_FETCH_SUCCESS,
      data: filteredData,
    };
  }

  async getTodoDetail(id: string): Promise<ApprovalTodoResponse> {
    const notifications = await this.sfService.models.notifications.get('*', {
      Id: id,
    });

    if (notifications.length === 0) {
      throw new NotFoundException();
    }

    console.log(notifications[0].Todo__c);

    const res = await this.sfService.models.todos.get('*', {
      Id: notifications[0].Todo__c,
      // Todo_Scope__c: 'Global',
    });
    console.log(res);

    const filteredData = {
      id: res[0]['Id'],
      name: res[0]['Name'],
      description: res[0]['Description__c'],
      taskStatus: res[0]['Task_status__c'],
      type: res[0]['Type__c'],
      completeBy: res[0]['Complete_By__c'],
      listedBy: res[0]['Listed_by__c'],
      eventAt: res[0]['Event_At__c'] || null,
      eventVenue: res[0]['Event_Venue__c'] || null,
      approvalStatus: res[0]['Status__c'],
      instituteId: res[0]['ParentId__c'],
    };

    return {
      statusCode: 200,
      message: Responses.IN_REVIEW_TODOS_FETCH_SUCCESS,
      data: filteredData,
    };
  }

  async approveTodo(id: string): Promise<BasicResponse> {
    await this.sfService.models.todos.update(
      {
        Status__c: 'Approved',
        Is_Admin_Reviewed__c: 'Yes',
      },
      id,
    );
    return { statusCode: 200, message: Responses.APPROVED };
  }

  async rejectTodo(id: string): Promise<BasicResponse> {
    await this.sfService.models.todos.update(
      {
        Status__c: 'Not Approved',
        Is_Admin_Reviewed__c: 'Yes',
      },
      id,
    );
    return { statusCode: 200, message: Responses.REJECTED };
  }
}
