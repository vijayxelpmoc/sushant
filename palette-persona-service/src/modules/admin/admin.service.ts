import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Notifier, Role } from '@gowebknot/palette-wrapper';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { Errors, Responses } from '@src/constants';
import {
  SFAdminContact,
  AdminInstituteName,
  AdminBEResponse,
} from '@src/types';
import { UpdateSfAdminDto } from './dto/admin-update-profile.dto';
import {
  AdminUpdateResponse,
  ApprovalTodoResponse,
} from './types/admin-interface';
import { env } from 'process';
import axios from 'axios';

@Injectable()
export class AdminService {
  private notifier: Notifier;
  private URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/firebase/testNotif'
      : `https://pxbgeue0h5.execute-api.ap-southeast-2.amazonaws.com/dev/firebase/testNotif`;
  constructor(private readonly sfService: SfService) {
    // this.notifier = new Notifier();
  }

  async getAdmin(id: string, instituteId: string, programId: string) {
    const responseData: SFAdminContact[] =
      await this.sfService.generics.contacts.get(
        'Id, Name, prod_uuid, dev_uuid, Phone, Palette_Email, Facebook, Whatsapp, Instagram, Website, Website_Title, Github, LinkedIn_URL, Account_Name, Profile_Picture, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode',
        // "Id,Name",
        {
          Id: id,
          Primary_Educational_Institution: programId,
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

    const adminData: AdminBEResponse = {
      Id: Id,
      name: Name,
      firebase_uuid: env.NODE_ENV === 'prod' ? prod_uuid : dev_uuid,
      phone: Phone,
      email: Palette_Email,
      profilePicture: Profile_Picture,
      instituteId: null,
      instituteLogo: null,
      institute_name: null,
      designation: '',
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

      adminData.instituteId = programId;
      adminData.instituteLogo = instituteDetails.Logo;
      adminData.institute_name = instituteDetails.Name;
    } else {
      const getInstitute = await this.sfService.models.affiliations.get(
        'Organization',
        {
          Contact: id,
          Organization: programId,
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
            // Program: programId,
          },
          {},
          instituteId,
        );

      adminData.instituteId = institute[0].Id;
      adminData.instituteLogo = institute[0].program_logo;
      adminData.institute_name = institute[0].Account_Name;
    }

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
    programId: string,
  ) {
    const responseData: any = this.sfService.generics.contacts.get(
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

    const {
      facebook,
      whatsapp,
      instagram,
      website,
      websiteTitle,
      github,
      linkedin,
    } = updateSfAdminDto;

    const updateObj: any = {};
    updateObj.Primary_Educational_Institution = programId;
    updateObj.Facebook = facebook;
    updateObj.Whatsapp = whatsapp;
    updateObj.Instagram = instagram;
    updateObj.Github = github;
    updateObj.LinkedIn_URL = linkedin;
    updateObj.Website = website;
    updateObj.Website_Title = websiteTitle;

    // const updateObj: any = {};
    // updateObj.Primary_Educational_Institution = programId;
    // if (updateSfAdminDto.hasOwnProperty('facebook')) {
    //   const { facebook } = updateSfAdminDto;
    //   updateObj.Facebook = facebook;
    // }

    // if (updateSfAdminDto.hasOwnProperty('whatsapp')) {
    //   const { whatsapp } = updateSfAdminDto;
    //   updateObj.Whatsapp = whatsapp;
    // }

    // if (updateSfAdminDto.hasOwnProperty('instagram')) {
    //   const { instagram } = updateSfAdminDto;
    //   updateObj.Instagram = instagram;
    // }

    // if (updateSfAdminDto.hasOwnProperty('website')) {
    //   const { website } = updateSfAdminDto;
    //   updateObj.Website = website;
    // }

    // if (updateSfAdminDto.hasOwnProperty('websiteTitle')) {
    //   const { websiteTitle } = updateSfAdminDto;
    //   updateObj.Website_Title = websiteTitle;
    // }

    // if (updateSfAdminDto.hasOwnProperty('github')) {
    //   const { github } = updateSfAdminDto;
    //   updateObj.Github = github;
    // }

    // if (updateSfAdminDto.hasOwnProperty('linkedin')) {
    //   const { linkedin } = updateSfAdminDto;
    //   updateObj.LinkedIn_URL = linkedin;
    // }

    const updateUser: AdminUpdateResponse =
      await this.sfService.generics.contacts.update(id, updateObj, instituteId);

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

  /** gets In-Review opportunity detail
   *  @param {id} string opportunity id
   *  @returns {Object} status code and message and opportunity information
   */
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
      '*,Listed_by.Id, Listed_by.Name, Listed_by.Profile_Picture',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId,
    );

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
          valid: event.Valid || null,
          role: Role.Administrator,
          website: event.Website,
          startDate: event.Start_Date,
          endDate: event.End_Date,
          description: event.Description,
          Program: programId,
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
      // error
      // '*,Opportunity_Id.Listed_by, Opportunity_Id.Listed_by.Profile_Picture, Opportunity_Id.Listed_by.Name',
      '*',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId,
    );

    const oppor = await this.sfService.models.accounts.get(
      'Listed_by,Listed_by.Name,Listed_by.Id,Listed_by.Profile_Picture,Listed_by.Phone',
      { Id: mods[0].Opportunity_Id, Program: programId },
      {},
      instituteId,
    );

    // const user = await this.sfService.generics.contacts.get(
    //   'Name,Profile_Picture',
    //   { Id: mods[0].Listed_by },
    //   {},
    //   instituteId,
    // )[0];

    if (mods.length !== 0) {
      mods.map((event) => {
        const filteredDataObj = {
          Id: event.Id,
          creatorName: event.Opportunity_Id ? oppor[0].Listed_by.Name : null,
          creatorProfilePic: event.Opportunity_Id
            ? oppor[0].Listed_by.Profile_Picture
            : null,
          createdAt: event.Created_at,
          eventName: event.Account_Name,
          category: event.Category,
          phone: event.Phone,
          venue: event.Venue,
          role: Role.Administrator,
          valid: event.Valid,
          website: event.Website,
          startDate: event.Start_Date,
          endDate: event.End_Date,
          description: event.Description,
          approvalStatus: event.Status,
          Program: programId,
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

  // Global Todo
  async getTodos(instituteId: string, programId: string): Promise<any> {
    const res = await this.sfService.models.todos.get(
      '*,Listed_by.Phone,Listed_by.Id',
      {
        Status: 'In Review',
        Todo_Scope: 'Global',
        Program: programId,
      },
      {},
      instituteId,
    );

    const tasksId = res.map((e) => e.Id);

    const allResource = {};

    // tasksId.forEach(async (taskId) => {
    const resources: any[] =
      await this.sfService.models.resourceConnections.get(
        'Resource.Resource_Name,Resource.URL, Resource.Resource_Type,*',
        // 'Id,Name, Todo, Resource.Resource_Name,Resource.Id, Resource.URL, Resource.Resource_Type',
        // 'Resource_Connection_Name, Todo, Resource',
        {
          Todo: tasksId,
          Program: programId,
        },
        {},
        instituteId,
      );

    const resIds = resources.map((e) => e.Resource);

    const resor = await this.sfService.models.resources.get(
      '*',
      {
        Id: [...resIds],
        Program: programId,
      },
      {},
      instituteId,
    );

    resources !== [] &&
      resources.map((resource) => {
        if (resource.Resource) {
          const resourcesObj = {
            Id: resource.Resource.Id,
            name: resource.Resource.Resource_Name,
            url: resource.Resource.URL,
            type: resource.Resource.Resource_Type,
          };

          // if a record with a todo task is present then add the object into it or if not create one
          const hashResource = allResource[`${resource.Todo}`];
          if (hashResource) {
            hashResource.push(resourcesObj);
            allResource[`${resource.Todo}`] = hashResource;
          } else {
            const AllResources = [];
            AllResources.push(resourcesObj);
            allResource[`${resource.Todo}`] = AllResources;
          }
        }
      });

    if (res.length === 0) {
      throw new NotFoundException();
    }

    const filteredData = [];
    res.map((todo: any) => {
      filteredData.push({
        id: todo.Id,
        name: todo.To_do,
        description: todo.Description,
        taskStatus: todo.Task_Status,
        type: todo.Type,
        phone: todo.Listed_by && todo.Listed_by.Phone,
        completeBy: todo.Complete_By,
        listedBy: todo.Listed_by && todo.Listed_by.Id,
        eventAt: todo.Event_At || null,
        eventVenue: todo.Event_Venue || null,
        approvalStatus: todo.Status,
        instituteId: todo.Parent_Account,
        Program: todo.Program,
        createdAt: todo.Created_at,
        resources: allResource[todo.Id],
      });
    });

    return {
      statusCode: 200,
      message: 'AllIn-ReviewTodos',
      data: filteredData,
    };
  }

  async getTodoDetail(
    id: string,
    instituteId: string,
    programId: string,
  ): Promise<ApprovalTodoResponse> {
    const resNotif = await this.sfService.models.notifications.get(
      '*',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (resNotif.length === 0) {
      throw new NotFoundException();
    }

    const res = await this.sfService.models.todos.get(
      '*',
      {
        Id: resNotif[0].To_Do,
        Program: programId,
        // Todo_Scope: 'Global',
      },
      {},
      instituteId,
    );

    const user = await this.sfService.generics.contacts.get(
      '*',
      {
        Id: res[0].Listed_by,
        Primary_Educational_Institution: programId,
      },
      {},
      instituteId,
    );

    const filteredData = {
      id: res[0]['Id'],
      name: res[0]['To_do'],
      description: res[0]['Description'],
      taskStatus: res[0]['Task_Status'],
      type: res[0]['Type'],
      phone: res[0]['Phone'],
      completeBy: res[0]['Complete_By'],
      listedBy: res[0]['Listed_by'],
      eventAt: res[0]['Event_At'] || null,
      eventVenue: res[0]['Event_Venue'] || null,
      approvalStatus: res[0]['Status'],
      instituteId: res[0]['Parent_Account'],
      creatorPic: user.length !== 0 ? user[0].Profile_Picture : null,
      creatorName: user.length !== 0 ? user[0].Name : null,
      createdAt: res[0].Created_at ? res[0].Created_at : res[0].CreatedDate,
      Program: res[0].Program,
    };

    return {
      statusCode: 200,
      message: 'In-ReviewTodoDetail',
      data: filteredData,
    };
  }

  async approveTodo(id: string, instituteId: string): Promise<any> {
    await this.sfService.models.todos.update(
      {
        Status: 'Approved',
        Is_Admin_Reviewed: 'Yes',
      },
      id,
      instituteId,
    );
    return { statusCode: 200, message: 'Approved' };
  }

  async rejectTodo(id: string, instituteId): Promise<any> {
    await this.sfService.models.todos.update(
      {
        Status: 'Not Approved',
        Is_Admin_Reviewed: 'Yes',
      },
      id,
      instituteId,
    );
    return { statusCode: 200, message: 'Rejected' };
  }
  /** approves the opportunity
   *  @param {id} string opportunity id
   */
  async approvalStatus(
    id: string,
    type: string,
    userId: string,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    let notificationTitle = ``;
    let notificationMsg = ``;
    if (
      type === 'Opportunity Approval Request' ||
      type === 'Opportunity Removal Request'
    ) {
      // get opportunity.
      const opp = await this.sfService.models.accounts.get(
        '*',
        { Id: id, Program: programId },
        {},
        instituteId,
      );
      if (opp.length == 0) {
        throw new NotFoundException(`Opportunity Not Found`);
      }
      // updates status to approved
      if (type === 'Opportunity Approval Request') {
        // already apporved.
        if (opp[0].Approval_Status === 'Approved') {
          return { statusCode: 200, message: 'Already Approved' };
        }

        // update opportunity.
        await this.sfService.models.accounts.update(
          {
            Approval_Status: 'Approved',
            Status_At: new Date(),
            // Modification: null,
          },
          id,
          instituteId,
        );

        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} approved`;
        try {
          // firebase notification for creator.
          const res = await axios.post(this.URL, {
            instituteId,
            programId,
            userId: opp[0].Listed_by,
            title: notificationTitle,
            message: notificationMsg,
            data: {
              data: await this.GetOpportunityNotificationData(
                id,
                userId,
                instituteId,
                programId,
              ),
              type: 'opportunity approval request',
            },
          });
          // console.log('res', res);

          // return res;
          //   await this.firebaseService.sendNotification(
          //     opp[0].Listed_by,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         id,
          //         userId,
          //       ),
          //       type: 'opportunity approval request',
          //     },
          //   );
        } catch (err) {
          console.log(`err`, err.response.data);
        }
        // create SF notification for creator
        await this.sfService.models.notifications.create(
          {
            Title: notificationMsg,
            Contact: opp[0].Listed_by,
            Opportunity: id,
            Type: 'Opportunity Approved',
            Notification_By: userId,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          },
          instituteId,
        );
        return {
          statusCode: 200,
          message: 'Approved',
        };
      }
      if (type === 'Opportunity Removal Request') {
        if (opp[0].Removal_Status === 'Approved') {
          return { statusCode: 200, message: 'Already Approved' };
        }

        // updating opportunity.
        const result = await this.sfService.models.accounts.update(
          {
            Visibility: 'Removed',
            Removal_Status: 'Approved',
            Removal_at: new Date(),
            Modification: null,
            // Approval_Status: 'Rejected',
            // Status_At: new Date(),
          },
          id,

          instituteId,
        );
        if (result.success !== true) {
          return { statusCode: 200, message: 'Something Went Wrong' };
        }

        // notification for creator.
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} removal approved.`;
        try {
          const res = await axios.post(this.URL, {
            instituteId,
            programId,
            userId: opp[0].Listed_by,
            title: notificationTitle,
            message: notificationMsg,
            data: {
              data: await this.GetOpportunityNotificationData(
                id,
                userId,
                instituteId,
                programId,
              ),
              type: 'opportunity removal request',
            },
          });
          // console.log('res', res);

          // return res;
          //   // firebase notification.
          //   await this.firebaseService.sendNotification(
          //     opp[0].Listed_by,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         id,
          //         userId,
          //       ),
          //       type: 'opportunity removal request',
          //     },
          //   );
        } catch (err) {
          console.log(`err`, err.response.data);
        }
        // create SF notification for creator.
        await this.sfService.models.notifications.create(
          {
            Title: notificationMsg,
            Contact: opp[0].Listed_by,
            Opportunity: id,
            Type: 'Opportunity Removed',
            Notification_By: userId,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          },

          instituteId,
        );

        // considerations.
        const recc = await this.sfService.models.recommendations.get(
          'Id, Assignee, Name',
          {
            Event: id,
            Program: programId,
          },
          {},
          instituteId,
        );
        const reccIds = [];
        notificationTitle = `${opp[0].Name} opportunity removed.`;
        notificationMsg = `${opp[0].Name} opportunity has been removed by creator.`;
        if (recc.length > 0) {
          recc.map(async (rec) => {
            reccIds.push(rec.Id);
            try {
              const res = await axios.post(this.URL, {
                instituteId,
                programId,
                userId: rec.Assignee,
                title: notificationTitle,
                message: notificationMsg,
                data: {
                  data: 'CREATEPAYLOAD',
                  type: 'opportunity removed',
                },
              });
              // console.log('res', res);

              // return res;
              //   // firebase notification.
              //   await this.firebaseService.sendNotification(
              //     rec.Assignee,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: 'CREATEPAYLOAD',
              //       type: 'opportunity removed',
              //     },
              //   );
            } catch (err) {
              console.log(`err`, err.response.data);
            }
            // creating Sf notification.
            await this.sfService.models.notifications.create(
              {
                Title: notificationTitle,
                Contact: rec.Assignee,
                Opportunity: id,
                Type: 'Opportunity Removed',
                Notification_By: userId,
                Created_at: new Date(),
                Is_Read: false,
                Program: programId,
              },

              instituteId,
            );
          });
          await this.sfService.models.recommendations.delete(
            reccIds,
            instituteId,
          );
        }

        // todos.
        const todoIds = [];
        const todoObj = {
          Status: 'Not Approved',
          Task_Status: 'Closed',
        };
        // getting opportunity todos.
        const connectedTodoIds = await this.sfService.models.todos.get(
          'Id, Assignee',
          {
            Opportunit_Id: id,
            Program: programId,
          },
          {},
          instituteId,
        );
        for (const event of connectedTodoIds) {
          // todoIds.push(event.Id)
          await this.sfService.models.todos.update(
            todoObj,
            event.Id,

            instituteId,
          );
        }
        // updating todos.
        // await this.sfService.models.todos.updateWithIds(todoIds, todoObj);
        // assignee notifications for todo removal.
        connectedTodoIds.map(async (event) => {
          notificationTitle = `Todo removed`;
          notificationMsg = `Todo has been removed`;
          try {
            const res = await axios.post(this.URL, {
              instituteId,
              programId,
              userId: event.Assignee,
              title: notificationTitle,
              message: notificationMsg,
              data: {
                data: await this.GetOpportunityNotificationData(
                  id,
                  userId,
                  instituteId,
                  programId,
                ),
                type: 'opportunity removal',
              },
            });
            // console.log('res', res);

            // return res;
            //   await this.firebaseService.sendNotification(
            //  event.Assignee,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: await this.utilityService.GetTodoNotificationData(id),
            //       type: 'opportunity removal',
            //     },
            //   );
          } catch (err) {
            console.log('err', err.response.data);
          }
          // create SF notification for creator.
          await this.sfService.models.notifications.create(
            {
              Title: `${opp[0].Name} opportunity removed.`,
              Contact: event.Assignee,
              Opportunity: id,
              Type: 'Opportunity Removed',
              Notification_By: userId,
              Created_at: new Date(),
              Is_Read: false,
              Program: programId,
            },
            instituteId,
          );
        });
        return { statusCode: 200, message: 'Approved' };
      }
    }
    if (type === 'Opportunity Modification Request') {
      // getting modification details.
      const mods = await this.sfService.models.modifications.get(
        '*',
        {
          Id: id,
          Program: programId,
        },
        {},
        instituteId,
      );
      if (mods.length == 0) {
        throw new NotFoundException(`Not Found!`);
      }

      // already approved.
      if (mods[0].Status === 'Approved') {
        return { statusCode: 200, message: 'Already Approved!' };
      }

      // updating modification.
      await this.sfService.models.modifications.update(
        {
          Status: 'Approved',
          Program: programId,
        },
        id,

        instituteId,
      );

      // getting opportunity.
      const opp = await this.sfService.models.accounts.get(
        'Name, Listed_by',
        {
          Id: mods[0]['Opportunity_Id'],
          Program: programId,
        },
        {},
        instituteId,
      );
      // update opportunity modification data.
      const oppModData = {
        Name: mods[0]['Account_Name'],
        Phone: mods[0]['Phone'],
        Category: mods[0]['Cate'],
        Description: mods[0]['Description'],
        End_Date: mods[0]['End_Date'],
        Start_Date: mods[0]['Start_Date'],
        Venue: mods[0]['Venue'],
        Website: mods[0]['Website'],
        Modification: null,
      };
      // updating opportunity.
      await this.sfService.models.accounts.update(
        oppModData,
        mods[0]['Opportunity_Id'],
        instituteId,
      );

      notificationTitle = `Opportunity ${opp[0].Name}`;
      notificationMsg = `Opportunity ${opp[0].Name} modification request approved.`;
      try {
        const res = await axios.post(this.URL, {
          instituteId,
          programId,
          userId: opp[0].Listed_by,
          title: notificationTitle,
          message: notificationMsg,
          data: {
            data: await this.GetOpportunityNotificationData(
              id,
              userId,
              instituteId,
              programId,
            ),
            type: 'opportunity modification request',
          },
        });
        // console.log('res', res);

        // return res;
        //   // Push Notification for creator.
        //   await this.firebaseService.sendNotification(
        //     opp[0].Listed_by,
        //     notificationTitle,
        //     notificationMsg,
        //     {
        //       data: await this.utilityService.GetModificationNotificationData(id),
        //       type: 'opportunity modification request',
        //     },
        //   );
      } catch (err) {
        console.log(`err`, err.response.data);
      }
      // create sf notification for creator.
      await this.sfService.models.notifications.create(
        {
          Title: notificationMsg,
          Contact: opp[0]['Listed_by'],
          Opportunity: mods[0]['Opportunity_Id'],
          Modification: id,
          Type: 'Opportunity Modified',
          Notification_By: userId,
          Created_at: new Date(),
          Is_Read: false,
          Program: programId,
        },
        instituteId,
      );

      // considerations.
      const recc = await this.sfService.models.recommendations.get(
        'Id, Assignee',
        {
          Event: mods[0]['Opportunity_Id'],
          Program: programId,
        },
        {},
        instituteId,
      );
      notificationTitle = `Opportunity ${opp[0].Name}`;
      notificationMsg = `Opportunity ${opp[0].Name} has been updated.`;
      if (recc.length !== 0) {
        recc.map(async (rec) => {
          // updating all considerations.
          await this.sfService.models.recommendations.update(
            {
              Accepted: 'Pending',
            },
            rec.Id,
            instituteId,
          );

          try {
            const response = await axios.post(this.URL, {
              instituteId,
              programId,
              userId: rec.Assignee,
              title: notificationTitle,
              message: notificationMsg,
              data: {
                data: 'CREATEPAYLOAD',
                type: 'opportunity modification request',
              },
            });
            // console.log(response);

            // return response;
            //   // Push Notification for creator.
            //   await this.firebaseService.sendNotification(
            //     rec.Assignee,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: 'CREATEPAYLOAD',
            //       type: 'opportunity modification request',
            //     },
            //   );
          } catch (err) {
            console.log(`err`, err.response.data);
          }
          // create notification for assignees.
          await this.sfService.models.notifications.create(
            {
              Title: `consideration ${opp[0].Name} opportunity updated`,
              Contact: rec.Assignee,
              Opportunity: mods[0]['Opportunity_Id'],
              Type: 'Opportunity Modified',
              Notification_By: userId,
              Created_at: new Date(),
              Is_Read: false,
              Program: programId,
            },
            instituteId,
          );
        });
      }

      // todos.
      const todos = await this.sfService.models.todos.get(
        'Id, Assignee',
        {
          Opportunity_Id: mods[0]['Opportunity_Id'],
          Program: programId,
        },
        {},
        instituteId,
      );
      // todo modification object.
      const todoModObj = {
        Assignee_accepted_status: 'Requested',
        Complete_By: mods[0]['End_Date'],
        Description: mods[0]['Description'],
        Event_At: mods[0]['Start_Date'],
        Event_Venue: mods[0]['Venue'],
        Reminder_at: null,
        Status: 'Requested',
        Task_status: 'Open',
        Name: mods[0]['Account_Name'],
        Type: mods[0]['Cate'],
      };
      // notification.
      notificationTitle = `Opportunity ${opp[0].Name}`;
      notificationMsg = `Opportunity ${opp[0].Name} has been updated.`;
      if (todos.length !== 0) {
        todos.map(async (todo) => {
          // updating all todos.
          await this.sfService.models.todos.update(
            todoModObj,
            todo.Id,
            instituteId,
          );

          try {
            const res = await axios.post(this.URL, {
              instituteId,
              programId,
              userId: todo.Assignee,
              title: notificationTitle,
              message: notificationMsg,
              data: {
                data: 'CREATEPAYLOAD',
                type: 'opportunity modification request',
              },
            });
            // console.log('res', res);

            // return res;
            //   // Push Notification for creator.
            //   await this.firebaseService.sendNotification(
            //     todo.Assignee,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: 'CREATEPAYLOAD',
            //       type: 'opportunity modification request',
            //     },
            //   );
          } catch (err) {
            console.log(`err`, err.response.data);
          }
          // create notification for assignees
          await this.sfService.models.notifications.create(
            {
              Title: `${opp[0].Name} opportunity updated`,
              Contact: todo.Assignee,
              Opportunity: mods[0]['Opportunity_Id'],
              Type: 'Opportunity Modified',
              Notification_By: userId,
              Created_at: new Date(),
              Is_Read: false,
              Program: programId,
            },
            instituteId,
          );
        });
      }
      return { statusCode: 200, message: 'Approved' };
    }
    return { statusCode: 200, message: 'failure' };
  }

  /** rejects the opportunity
   *  @param {id} string opportunity id
   */
  async rejectOpportunity(
    id: string,
    type: string,
    userId: string,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    let notificationTitle = ``;
    let notificationMsg = ``;
    if (
      type === 'Opportunity Approval Request' ||
      type === 'Opportunity Removal Request'
    ) {
      // getting opportunity.
      const opp = await this.sfService.models.accounts.get(
        '*',
        { Id: id, Program: programId },
        {},
        instituteId,
      );
      // console.log(opp);

      if (opp.length === 0) {
        throw new NotFoundException(`Opportunity Not Found!`);
      }

      if (type === 'Opportunity Approval Request') {
        // already rejected.
        if (opp[0].Approval_Status === 'Rejected') {
          return {
            statusCode: 200,
            message: 'Already Rejected',
          };
        }

        // updating opportunity.
        await this.sfService.models.accounts.update(
          {
            Approval_Status: 'Rejected',
            Status_At: new Date(),
          },
          id,
          instituteId,
        );

        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} rejected`;
        try {
          const res = await axios.post(this.URL, {
            instituteId,
            programId,
            userId: opp[0].Listed_by,
            title: notificationTitle,
            message: notificationMsg,
            data: {
              data: await this.GetOpportunityNotificationData(
                id,
                userId,
                instituteId,
                programId,
              ),
              type: 'opportunity approval request',
            },
          });
          // console.log('res', res);

          // return res;
          //   // firebase notification for creator.
          //   await this.firebaseService.sendNotification(
          //     opp[0].Listed_by,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         id,
          //         userId,
          //       ),
          //       type: 'opportunity approval request',
          //     },
          //   );
        } catch (err) {
          console.log(`err`, err.response.data);
        }
        // create sf notification for creator.
        await this.sfService.models.notifications.create(
          {
            Title: notificationMsg,
            Contact: opp[0].Listed_by,
            Opportunity: id,
            Type: 'Opportunity Rejected',
            Notification_By: userId,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          },
          instituteId,
        );
      }
      if (type === 'Opportunity Removal Request') {
        // already rejected.
        if (opp[0].Removal_Status === 'Rejected') {
          return { statusCode: 200, message: 'Already Rejected' };
        }

        // updating opportunity.
        await this.sfService.models.accounts.update(
          {
            Removal_Status: 'Rejected',
            Removal_at: new Date(),
          },
          id,
          instituteId,
        );
        // notification.
        notificationTitle = `Opportunity ${opp[0].Name}`;
        notificationMsg = `Opportunity ${opp[0].Name} removal request is rejected`;
        try {
          const res = await axios.post(this.URL, {
            instituteId,
            programId,
            userId: opp[0].Listed_by,
            title: notificationTitle,
            message: notificationMsg,
            data: {
              data: await this.GetOpportunityNotificationData(
                id,
                userId,
                instituteId,
                programId,
              ),

              type: 'opportunity removal request',
            },
          });
          // console.log('res', res);

          // return res;
          //   // firebase notification for creator.
          //   await this.firebaseService.sendNotification(
          //     opp[0].Listed_by,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         id,
          //         userId,
          //       ),
          //       type: 'opportunity removal request',
          //     },
          //   );
        } catch (err) {
          console.log(`err`, err.response.data);
        }
        // create sf notification for creator.
        // await this.sfService.models.notifications.create(
        //   {
        //     Title: notificationMsg,
        //     Contact: opp[0].Listed_by,
        //     Opportunity: id,
        //     Type: 'Opportunity Removal Rejected',
        //     Notification_By: userId,
        //     Created_at: new Date(),
        //     Is_Read: false,
        //     Program: programId,
        //   },
        //   instituteId,
        // );
      }
      return { statusCode: 200, message: 'Rejected' };
    }
    if (type === 'Opportunity Modification Request') {
      // getting modification details.
      const mods = await this.sfService.models.modifications.get(
        '*',
        { Id: id, Program: programId },
        {},
        instituteId,
      );
      if (mods.length == 0) {
        throw new NotFoundException(`Not Found!`);
      }
      // already rejected.
      if (mods[0].Status === 'Rejected') {
        return { statusCode: 200, message: 'Already Rejected' };
      }

      // updating modification.
      await this.sfService.models.modifications.update(
        {
          Status: 'Rejected',
        },
        id,
        instituteId,
      );

      const modsOppData = {
        // Modification_Status: 'Rejected',
        Modification: null,
      };
      // updaating opportunity.
      await this.sfService.models.accounts.update(
        modsOppData,
        mods[0]['Opportunity_Id'],
        instituteId,
      );
      // getting opportunity.
      const opp = await this.sfService.models.accounts.get(
        'Name, Listed_by',
        {
          Id: mods[0]['Opportunity_Id'],
          Program: programId,
        },
        {},
        instituteId,
      );
      // notification.
      notificationTitle = `Opportunity ${opp[0].Name}`;
      notificationMsg = `Opportunity ${opp[0].Name} modification request is rejected`;
      try {
        const res = await axios.post(this.URL, {
          instituteId,
          programId,
          userId: opp[0].Listed_by,
          title: notificationTitle,
          message: notificationMsg,
          data: {
            data: await this.GetOpportunityNotificationData(
              id,
              userId,
              instituteId,
              programId,
            ),
            type: 'opportunity modification request',
          },
        });
        // console.log('res', res);

        // return res;
        //   // Push Notification for creator.
        //   await this.firebaseService.sendNotification(
        //     opp[0].Listed_by,
        //     notificationTitle,
        //     notificationMsg,
        //     {
        //       data: await this.utilityService.GetModificationNotificationData(id),
        //       type: 'opportunity modification request',
        //     },
        //   );
      } catch (err) {
        console.log(`err`, err.response.data);
      }
      // create sf notification for creator.
      await this.sfService.models.notifications.create(
        {
          Title: notificationMsg,
          Contact: opp[0]['Listed_by'],
          Opportunity: mods[0]['Opportunity_Id'],
          Modification: id,
          Type: 'Opportunity Modification Rejected',
          Notification_By: userId,
          Created_at: new Date(),
          Is_Read: false,
          Program: programId,
        },
        instituteId,
      );
      return { statusCode: 200, message: 'Rejected' };
    }
    return { statusCode: 400, message: 'Failure' };
  }

  async GetOpportunityNotificationData(
    OppId: string,
    userId: string,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    if (OppId == null || OppId == '' || userId == null || userId == '') {
      throw new NotFoundException();
    }
    const opportunity = await this.sfService.models.accounts.get(
      '*',
      { Id: OppId, Program: programId },
      {},
      instituteId,
    );
    // not found.
    if (opportunity.length == 0) {
      throw new NotFoundException(`Oops, Not Found!`);
    }

    const InstitueObj = {};
    const interestedUsers = [];
    const enrolledUsers = [];

    // institute from affiliation.
    const InstitutesData = await this.sfService.models.affiliations.get(
      'Organization',
      { Contact: userId, Organization: programId },
      {},
      instituteId,
    );
    if (InstitutesData.length > 0) {
      const Institutes = await this.sfService.models.accounts.get(
        '*',
        {
          Id: InstitutesData[0].Organization,
          Program: programId,
        },
        {},
        instituteId,
      );
      if (Institutes.length > 0) {
        // mapping institute id : institute name.
        Institutes.map((ins) => {
          InstitueObj[ins.Id] = ins.Name;
        });
      }
    }

    // interested users in opportunity.
    const interestedUsersData = await this.sfService.models.recommendations.get(
      'Assignee',
      { Event: OppId, Program: programId },
      {},
      instituteId,
    );
    if (interestedUsersData.length > 0) {
      interestedUsersData.map((interested) => {
        interestedUsers.push(interested.Assignee);
      });
    }

    // enrolled users in opportunity.
    const enrolledUsersData = await this.sfService.models.todos.get(
      'Assignee',
      {
        Opportunit_Id: OppId,
        Program: programId,
      },
      {},
      instituteId,
    );
    if (enrolledUsersData.length > 0) {
      enrolledUsersData.map((enrolled) => {
        enrolledUsers.push(enrolled.Assignee);
      });
    }

    const wishListedEvent = await this.sfService.models.recommendations.get(
      'Id',
      {
        Event: OppId,
        Recommended_by: userId,
        Program: programId,
      },
      {},
      instituteId,
    );
    const recomendedEvent = await this.sfService.models.recommendations.get(
      'Id',
      {
        Event: OppId,
        Program: programId,
      },
      {},
      instituteId,
    );
    const enrolledEvent = await this.sfService.models.todos.get(
      'Id',
      {
        Opportunit_Id: OppId,
        Program: programId,
      },
      {},
      instituteId,
    );

    const opportunityDataObj = {
      activity: {
        activity_id: opportunity[0].Id,
        name: opportunity[0].Name,
        category: opportunity[0].Category,
        start_date: opportunity[0].Start_Date,
        end_date: opportunity[0].End_Date,
        description: opportunity[0].Description,
        venue: opportunity[0].Venue,
        phone: opportunity[0].Phone,
        shipping_address: opportunity.ShippingAddress
          ? {
              city: opportunity[0].ShippingAddress.city,
              country: opportunity[0].ShippingAddress.country,
              postal_code: opportunity[0].ShippingAddress.postalCode,
              state: opportunity[0].ShippingAddress.state,
              street: opportunity[0].ShippingAddress.street,
            }
          : {
              city: null,
              country: null,
              postal_code: null,
              state: null,
              street: null,
            },
        website: opportunity[0].Website,
        ListedBy: opportunity[0].Listed_by,
        OpportunityScope: opportunity[0].opportunityScope,
        institute: {
          Id: opportunity[0].ParentId,
          name: InstitueObj[opportunity[0].ParentId],
        },
        interestedUsers: interestedUsers,
        enrolledUsers: enrolledUsers,
      },
      wishListedEvent: wishListedEvent.length > 0 ? true : false,
      recomendedEvent: recomendedEvent.length > 0 ? true : false,
      enrolledEvent: enrolledEvent.length > 0 ? true : false,
      resources: [],
    };
    return opportunityDataObj;
  }
}
