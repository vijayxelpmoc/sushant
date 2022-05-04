import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CommentsDto } from './dtos/create-comments.dto';
import {
  AllCommentsDto,
  DraftInfoDto,
  OpportunitiesInfoDto,
} from './dtos/opportunities.dto';
import { BasicResponse } from './types/login-interface';
import {
  GuardianObserverSubRoles,
  GuardianSubRoles,
  MentorSubRoles,
} from './types';
import {
  NotificationType,
  NotificationTypePush,
  // SfService,
  Notifier,
} from '@gowebknot/palette-wrapper';
import {
  AccountActivity,
  ApprovalStatus,
  CommentType,
  Errors,
  NotificationDataTexts,
  NotificationDataTypes,
  NotificationMessage,
  NotificationTitles,
  OpportunityScope,
  OpportunityStatus,
  RecordTypeName,
  RemovalStatus,
  Responses,
  Roles,
  Visibility,
} from '@src/constants';
import _ from 'lodash';
import { CreatedByUserOpportunity } from './types/create-opportunity-interface';
import { SfService } from '@gowebknot/palette-salesforce-service';
import { SFALlAccountFields } from '@src/types/sf-interface';

@Injectable()
export class OpportunityService {

  private notifier: Notifier;
  constructor(
    private sfService: SfService
  ) {
    this.notifier = new Notifier();
  }

  async CreateOpportunityOtherRoles(
    userId: string,
    recordTypeName: string,
    opportunitiesInfoDto: OpportunitiesInfoDto,
    instituteId: string,
  ): Promise<BasicResponse> {
    const {
      eventTitle,
      description,
      eventDateTime,
      expirationDateTime,
      phone,
      website,
      venue,
      eventType,
      assignees,
      InstituteId,
    } = opportunitiesInfoDto;

    const recordTypeId = await this.sfService.models.accounts.get('Account_Record_Type', {
        Record_Type_Name: AccountActivity.ACTIVITY,
      },
      {},
      instituteId,
    );

    if (assignees) {
      for (let assignee of assignees) {
        // save on salesforce for assignee
        await this.sfService.models.accounts.create(
          {
            Account_Name: eventTitle,
            Account_Record_Type: recordTypeId[0].Account_Record_Type,
            Description: description,
            Venue: venue,
            Website: website,
            Start_Date: eventDateTime ? new Date(eventDateTime) : null,
            Phone: phone,
            Type: eventType,
            Listed_by: userId,
            Approval_Status: 'Approved',
            Event_Assignee: assignee,
            End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
          },
          instituteId,
        );
      }
    }

    if (InstituteId) {
      // save on salesforce for Institute
      await this.sfService.models.accounts.create(
        {
          Account_Name: eventTitle,
          Account_Record_Type: recordTypeId[0].Account_Record_Type,
          Description: description,
          Venue: venue,
          Website: website,
          Start_Date: eventDateTime ? new Date(eventDateTime) : null,
          Phone: phone,
          Type: eventType,
          Listed_by: userId,
          Approval_Status: 'In Review',
          Parent_Account: InstituteId,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
        },
        instituteId,
      );
      // NO NOTIFICATION PRESENT
    }
    return { statusCode: 201, message: Responses.OPPORTUNITY_CREATED };
  }

  /** gets all self created opportunities
   *  @param {userId} string user id
   * @returns {Object} status code and message and opportunity information
   */
   async getLinkedOpportunities(userId: string, instituteId: string) {
    const createdOpportunities = await this.sfService.models.accounts.get('*', {
        Listed_by: userId,
      },
      {},
      instituteId,
    );

    const assignedOpportunities = await this.sfService.models.accounts.get('*', {
        Event_Assignee: userId,
      },
      {},
      instituteId,
    );

    const filteredData = [];
    createdOpportunities.map(event => {
      if (
        (event.Approval_Status == 'Approved' && event.opportunityScope == 'Global') ||
        (event.opportunityScope == 'Discrete' && event.Visibility == 'Available')
      ) {
        const filterDataObj = {
          Id: event.Id,
          eventName: event.Account_Name,
          description: event.Description,
          venue: event.Venue,
          website: event.Website,
          eventDate: event.Start_Date ? new Date(event.Start_Date) : null,
          phone: event.Phone,
          Type: event.Category,
          approvalStatus: event.Approval_Status,
          expirationDate: event.End_Date
            ? new Date(event.End_Date)
            : null,
          opportunityScope: event.opportunityScope,
        };
        filteredData.push(filterDataObj);
      }
    });
    assignedOpportunities.map(event => {
      if (
        (event.Approval_Status == 'Approved' && event.opportunityScope == 'Global') ||
        (event.opportunityScope == 'Discrete' && event.Visibility == 'Available')
      ) {
        const filterDataObj = {
          Id: event.Id,
          eventName: event.Account_Name,
          description: event.Description,
          venue: event.Venue,
          website: event.Website,
          eventDate: event.Start_Date ? new Date(event.Start_Date) : null,
          phone: event.Phone,
          Type: event.Category,
          approvalStatus: event.Approval_Status,
          expirationDate: event.End_Date
            ? new Date(event.End_Date)
            : null,
          opportunityScope: event.opportunityScope,
        };
        filteredData.push(filterDataObj);
      }
    });
    return { statusCode: 201, message: '', data: filteredData };
  }

  /** updates an opportunity for all user
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   *  @param {opportunityId} string the id of the record we updating
   * @returns {Object} status code and message
   */
   async updateOpportunity(
    opportunitiesInfoDto: OpportunitiesInfoDto,
    opportunityId: string,
    userId: string,
    instituteId: string,
  ) {
    // get record details by id
    // const dataExist: SFALlAccountFields[] = await this.sfService.getAccount(
    const dataExist: any = await this.sfService.models.accounts.get('*', {
        Id: opportunityId,
      },
      {},
      instituteId,
    );

    // checking if the record user is trying to edit  whether it is been created by them
    if (dataExist[0].Listed_by !== userId) throw new BadRequestException('you are not the creator of this opportunity.',);

    //bad request if there isn't any record for that id
    if (!dataExist) throw new BadRequestException('Record not found');

    const {
      eventTitle,
      description,
      eventDateTime,
      expirationDateTime,
      phone,
      website,
      venue,
      eventType,
    } = opportunitiesInfoDto;

    const updateStatus = await this.sfService.models.accounts.update(
      {
        Account_Name: eventTitle,
        Description: description,
        Venue: venue,
        Website: website,
        Start_Date: eventDateTime ? new Date(eventDateTime) : null,
        Phone: phone,
        Type: eventType,
        End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
      },
      opportunityId,
      instituteId,
    );
    
    // check logic !!! by @abhinav
    // const opp = await this.sfService.models.accounts.get('*', { 
    //     Id: opportunityId 
    //   },
    //   {},
    //   instituteId,
    // );

    // if (opp.Todo__c.length > 0) {
    //   await this.sfService.updateTodo(opp.Todo__c, {
    //     Name: eventTitle,
    //     Description__c: description,
    //     Event_Venue__c: venue,
    //     Type__c: eventType,
    //   });
    // }

    if (updateStatus.success == true) {
      return { statusCode: 201, message: Responses.OPPORTUNITY_UPDATED };
    } else {
      throw new BadRequestException();
    }
  }

  /** creates an opportunity for advisor, parent, admin role
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   *  @param {assigneeId} string if the opportunity is for a user then the assignee id
   *  @param {InstituteId} string if the opportunity is for a Institute then the institute id
   * @returns {Object} status code and message
   */
   async CreateOpportunityForMultipleStudents(
    userId: string,
    OpportunitiesInfoDto: OpportunitiesInfoDto,
    instituteId: string,
  ): Promise<BasicResponse> {
    const {
      eventTitle,
      description,
      eventDateTime,
      expirationDateTime,
      phone,
      website,
      venue,
      eventType,
      assignees,
      InstituteId,
    } = OpportunitiesInfoDto;

    const recordTypeId = await this.sfService.models.accounts.get(
      'Account_Record_Type',
      {
        Record_Type_Name: AccountActivity.ACTIVITY,
      },
      {},
      instituteId,
    );

    let createResponse = null;
    for (let i = 0; i < assignees.length - 1; i++) {
      if (assignees[i]) {
        // save on salesforce for assignee
        createResponse = await this.sfService.models.accounts.create({
            Account_Name: eventTitle,
            Account_Record_Type: recordTypeId[0].Account_Record_Type,
            Description: description,
            Venue: venue,
            Website: website,
            Start_Date: eventDateTime ? new Date(eventDateTime) : null,
            Phone: phone,
            Type: eventType,
            Listed_by: userId,
            Approval_Status: 'Approved',
            Event_Assignee: assignees[i],
            End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
          },
          instituteId,
        );
      }
    }

    if (InstituteId) {
      // save on salesforce for Institute
      createResponse = await this.sfService.models.accounts.create({
          Account_Name: eventTitle,
          Account_Record_Type: recordTypeId[0].Account_Record_Type,
          Description: description,
          Venue: venue,
          Website: website,
          Start_Date: eventDateTime ? new Date(eventDateTime) : null,
          Phone: phone,
          Type: eventType,
          Listed_by: userId,
          Approval_Status: 'In Review',
          Parent_Account: InstituteId,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
        },
        instituteId,
      );
    }
    
    if (createResponse) {
      if (assignees.length > 0) {
        return {
          statusCode: 201,
          message: `Opportunity created for ${
            assignees.length
          } users successfully.`,
        };
      } else {
        return {
          statusCode: 201,
          message: `Opportunity created for users successfully.`,
        };
      }
    } else {
      throw new BadRequestException();
    } 
  }


  /** adds opportunities in bulk to to do for students
   *  @param {userId} string user id
   *  @param {opportunities} string[] a list of all opportunities to be added
   * @returns {Object} status code and message
   */
   async bulkEditOpportunitiesStudent(
    userId: string,
    opportunities: string[],
    instituteId: string,
  ): Promise<any> {
    if (opportunities.length == 0 || !opportunities) {
      throw new NotFoundException('Opportunities Ids Required');
    }

    const ConsiderationsObj = {};
    const delConsIds = [];
    const considerations = await this.sfService.models.recommendations.get('Id, Event', {
        Assignee: userId,
        Accepted: 'Pending',
      },
      {},
      instituteId,
    );
    
    considerations.map(cons => {
      ConsiderationsObj[cons.Event] = cons.Id;
    });

    const resultList = [];
    const GetTodos = await this.sfService.models.todos.get('Opportunit_Id', {
        Assignee: userId,
      },
      {},
      instituteId
    );
    const EventIds = [];
    GetTodos.map(activity => {
      if (activity.Opportunit_Id !== null) {
        EventIds.push(activity.Opportunit_Id);
      }
    });

    // const recordTypeId = await this.sfService.getActivitiesId();
    const todoList = [];
    for (let i = 0; i < opportunities.length; i++) {
      if (EventIds.indexOf(opportunities[i]) < 0) {
        const opp = await this.sfService.models.accounts.get('*', {
            Id: opportunities[i],
          },
          {},
          instituteId,
        );
        
        const groupId = uuidv4();
        if (ConsiderationsObj.hasOwnProperty(opportunities[i])) {
          delConsIds.push(ConsiderationsObj[opportunities[i]]);
        }
        if (opp[0].opportunityScope === 'Discrete') {
          const discreteAssigneeList = [];
          const discreteAssignee = await this.sfService.models.opportunities.get('Contact', { 
              Account: opportunities[i] 
            },
            {},
            instituteId,
          );
          discreteAssignee.map(assignee => {
            discreteAssigneeList.push(assignee.Contact);
          });
          if (discreteAssigneeList.indexOf(userId) > -1) {
            const todoObj = {
              Assignee: userId,
              Complete_By: opp[0].End_Date
                ? new Date(opp[0].End_Date)
                : null,
              Created_at: new Date(),
              Description: opp[0].Description,
              Event_At: opp[0].Start_Date
                ? new Date(opp[0].Start_Date)
                : null,
              Event_Venue: opp[0].Venue,
              Group_Id: groupId,
              Listed_by: opp[0].Listed_by,
              Status: 'Approved',
              Task_Status: 'Open',
              Todo_Scope: opp[0].opportunityScope,
              Type: opp[0].Category,
              Opportunit_Id: opportunities[i],
            };
            todoList.push(todoObj);
            resultList.push({
              opportunity: opportunities[i],
              status: 'Added',
            });
          } else {
            resultList.push({
              opportunity: opportunities[i],
              status: 'Not Added',
            });
          }
        } else if (opp[0].opportunityScope === 'Global' && opp[0].Approval_Status == 'Approved') {
          const todoObj = {
            Assignee: userId,
            Complete_By: opp[0].End_Date
              ? new Date(opp[0].End_Date)
              : null,
            Created_at: new Date(),
            Description: opp[0].Description,
            Event_At: opp[0].Start_Date
              ? new Date(opp[0].Start_Date)
              : null,
            Event_Venue: opp[0].Venue,
            Group_Id: groupId,
            Listed_by: opp[0].Listed_by,
            Status: 'Requested',
            Task_Status: 'Open',
            Todo_Scope: opp[0].opportunityScope,
            Type: opp[0].Category,
            Opportunit_Id: opportunities[i],
          };
          todoList.push(todoObj);
          resultList.push({
            opportunity: opportunities[i],
            status: 'Added',
          });
        }
      } else {
        resultList.push({
          opportunity: opportunities[i],
          status: 'Not Added',
        });
      }
    }
    

    // FIX BULK CREATE
    let todoResponse = null;
    if (todoList.length > 0) {
      todoResponse = await this.sfService.models.todos.create(todoList[0], instituteId);
      console.log('todoResponse', todoResponse);
    }

    if (delConsIds.length > 0) {
      await this.sfService.models.recommendations.delete(delConsIds, instituteId);
    }

    if (todoResponse) {
      return {
        statusCode: 201,
        message: `Success`,
        data: resultList,
      };
    } else {
      throw new BadRequestException();
    }
  }

  /** adds opportunities in bulk to to do for Others
   *  @param {userId} string user id
   *  @param {assigneeId} string user id of the student the opportunities are to be recommended to
   *  @param {opportunities} string[] a list of all opportunities to be added
   * @returns {Object} status code and message
   */
   async bulkEditOpportunitiesOthers(
    userId: string,
    assigneeId: string,
    OpportunitiesInfoDto: OpportunitiesInfoDto[],
    instituteId: string,
  ) {
    for (let i = 0; i < OpportunitiesInfoDto.length; i++) {
      const groupId = uuidv4();

      const opportunityObj = [];
      const opportunity = OpportunitiesInfoDto[i];

      const obj: any = {
        Assignee: assigneeId,
        To_do: opportunity.eventTitle,
        Description: opportunity.description,
        Task_Status: 'Open',
        // Type: opportunity.type,
        // Complete_By: opportunity.completeBy,
        // Listed_by: opportunity.listedBy,
        Group_Id: groupId,
      };

      if (opportunity.venue) {
        obj.Event_Venue = opportunity.venue;
      }

      opportunityObj.push(obj);
      const createResponse = await this.sfService.models.todos.create(opportunityObj, instituteId);
      // return createResponse;
      if (createResponse.every(response => response.success)) {
        const Ids = createResponse.map(response => response.id);
        return {
          groupId,
          Ids,
        };
      }
    }
  }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> V2 APIS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // gets user global and discrete opportunities
  async getSelfOpportunities(userId: string, instituteId): Promise<any> {
    // gets listed by user global opportunities
    const listedby = await this.sfService.models.accounts.get('*', {
        Listed_by: userId,
      },
      { Created_at: -1 },
      instituteId,
    );
    console.log('listedby', listedby);
    

    const allOpportunities = await this.sfService.models.opportunities.get('Contact, Account',
      {},
      {},
      instituteId,
    );

    const allInterestedUsers = await this.sfService.models.recommendations.get('Assignee, Recommended_by, Event',
      {},
      {},
      instituteId,
    );

    const allEnrolledUsers = await this.sfService.models.todos.get(
      'Assignee, Opportunit_Id',
      {},
      {},
      instituteId,
    );

    const filteredData = [];
    if (listedby.length !== 0) {
      for (let i = 0; i < listedby.length; i++) {
        const assigneesList = [];
        if (listedby[i]['opportunityScope'] === 'Discrete') {
          for (let j = 0; j < allOpportunities.length; j++) {
            let curr_opportunity = allOpportunities[j];
            if (curr_opportunity.Account === listedby[i]['Id']) {
              assigneesList.push(curr_opportunity.Contact);
            }
          }
        }
        const interestedUsers = [];
        const enrolledUsers = [];

        for (let j = 0; j < allInterestedUsers.length; j++) {
          if (
            allInterestedUsers[j].Recommended_by == userId &&
            allInterestedUsers[j].Event == listedby[i]['Id']
          ) {
            interestedUsers.push(allInterestedUsers[j].Assignee);
          }
        }

        for (let j = 0; j < allEnrolledUsers.length; j++) {
          if (allEnrolledUsers[j].Opportunit_Id == listedby[i]['Id']) {
            enrolledUsers.push(allEnrolledUsers[j].Assignee);
          }
        }
        const filterDataObj = {
          Id: listedby[i]['Id'],
          eventName: listedby[i]['Account_Name'],
          description: listedby[i]['Description'],
          venue: listedby[i]['Venue'],
          website: listedby[i]['Website'],
          eventDate: listedby[i]['Start_Date']
            ? new Date(listedby[i]['Start_Date'])
            : null,
          phone: listedby[i]['Phone'],
          type: listedby[i]['Category'] || 'Others',
          visibility: listedby[i]['Visibility'],
          expirationDate: listedby[i]['End_Date']
            ? new Date(listedby[i]['End_Date'])
            : null,
          status: listedby[i]['Approval_Status'],
          opportunityScope: listedby[i]['opportunityScope'],
          assignees: assigneesList.length !== 0 ? assigneesList : null,
          modificationId: listedby[i]['Modification'],
          RemovalStatus: listedby[i]['Removal_Status'],
          interestedUsers: interestedUsers,
          enrolledUsers: enrolledUsers,
        };
        filteredData.push(filterDataObj);
      }
      return {
        statusCode: 200,
        message: 'Success',
        data: filteredData,
      };
    }
    throw new NotFoundException('OpportunitiesDoesNotExists!');
  }
  
  // adds opportunity to consideration
  async addtoConsiderations(
    userId: string,
    opportunityId: string,
    instituteId: string,
  ): Promise<BasicResponse> {
    const opp = await this.sfService.models.accounts.get('*', { 
        Id: opportunityId,
        Visibility: 'Available', 
      }, 
      {}, 
      instituteId,
    );

    // not found opportunity.
    if (opp.length === 0) {
      throw new NotFoundException('Opportunity not found!');
    }

    if (
      (opp[0].opportunityScope == 'Global' && opp[0].Approval_Status !== 'Approved') || 
      opp[0].Visibility !== 'Available' || 
      opp[0].Removal_Status == 'Approved'
    ) {
      return { statusCode: 403, message: 'Cannot add!' };
    }

    const getCons = await this.sfService.models.recommendations.get('Id', {
        Assignee: userId,
        Event: opportunityId,
      },
      {},
      instituteId,  
    );

    if (getCons.length !== 0) return { statusCode: 409, message: 'Already added!'}

    let considerationObj = {
      Assignee: userId,
      Event: opportunityId,
      Accepted: "Pending",
    };
    const createResponse = await this.sfService.models.recommendations.create(considerationObj, instituteId);

    if (createResponse) {
      return { statusCode: 201, message: 'AddedToConsiderations'};
    } else {
      throw new BadRequestException();      
    }
  }

  // adds opportunity to todo
  async addtoTodo(userId: string, opportunityId: string, instituteId: string): Promise<BasicResponse> {
    // fetching opportunity data
    const opp = await this.sfService.models.accounts.get('*', {
        Id: opportunityId,
      },
      {},
      instituteId,
    );

    // not found opportunity.
    if (opp.length === 0) {
      throw new NotFoundException('Opportunity not found!');
    }

    if (
      (opp[0].opportunityScope == 'Global' && opp[0].Approval_Status !== 'Approved') || 
      opp[0].Visibility !== 'Available' || 
      opp[0].Removal_Status == 'Approved'
    ) {
      return { statusCode: 403, message: 'Cannot add!' };
    } 

    // checking and removing considerations.
    const cons = await this.sfService.models.recommendations.get('Id', {
        Assignee: userId,
        Event: opportunityId,
      },
      {},
      instituteId,
    );
    if (cons.length > 0) {
      cons.map(async recc => {
        await this.sfService.models.recommendations.delete(recc.Id, instituteId);
      });
    }

    // check todo already exists
    const check = await this.sfService.models.todos.get('Id', {
        Assignee: userId,
        Opportunit_Id: opportunityId,
      },
      {},
      instituteId,
    );
    if (check.length !== 0) {
      return {
        statusCode: 403,
        message: 'TodoAlreadyExists',
      };
    }

    // extracting fetched data.
    const todo = await this.sfService.models.todos.create({
        To_do: opp[0]['Account_Name'],
        Opportunit_Id: opportunityId,
        Description: opp[0]['Description'],
        Complete_By: opp[0]['End_Date']
          ? new Date(opp[0]['End_Date'])
          : null,
        Assignee: userId,
        Task_Status: 'Open',
        Created_at: new Date(),
        Type: opp[0]['Category'],
        Event_Venue: opp[0]['Venue'],
        Event_At: opp[0]['Start_Date']
          ? new Date(opp[0]['Start_Date'])
          : null,
        Status: 'Approved',
      },
      instituteId,
    );
    let notificatonTitle = `Opportunity added to Todo`;
    let notificatonMsg = `Opportunity has been added to Todo`;
    if (opp.length !== 0) {
      // try {
      //   // create push notification
      //   await this.firebaseService.sendNotification(
      //     opp[0]['Listed_by'],
      //     notificatonTitle,
      //     notificatonMsg,
      //     {
      //       data: res[0],
      //       type: 'Todo',
      //     },
      //   );
      // } catch (error) {
      //   console.log('error', error);
      // }
      // create notification
      await this.sfService.models.notifications.create({
          Title: notificatonTitle,
          Contact: opp[0].Listed_by,
          Notification_By: userId,
          Created_at: new Date(),
          Is_Read: false,
          Event_type: opp[0]['Category'],
          To_Do: todo.id,
          Type: 'New To-Do',
        },
        instituteId,
      );
    }
    return {
      statusCode: 201,
      message: 'AddedToToDo',
    };
  }

  // creates an opportunity
  async CreateOpportunity(
    userId: string,
    recordTypeName: string,
    opportunitiesInfoDto: OpportunitiesInfoDto,
    instituteId: string,
  ): Promise<BasicResponse> {
    // getting account Activity
    const recordTypeId = await this.sfService.models.accounts.get('Account_Record_Type', { Record_Type_Name: AccountActivity.ACTIVITY }, {}, instituteId);
    if (recordTypeId.length === 0) {
      throw new BadRequestException(`Something went wrong!`);
    }

    // destructing dto
    const {
      eventTitle,
      description,
      eventDateTime,
      expirationDateTime,
      phone,
      website,
      venue,
      eventType,
      assignees,
      InstituteId,
    } = opportunitiesInfoDto;

    let notificationTitle = ``;
    let notificationMsg = ``;

    if (recordTypeName === 'Student') {
      if (assignees.length !== 0) {
        if (assignees.length > 1) {
          throw new BadRequestException(
            'You can create opportunity for only yourself',
          );
        }
        if (assignees[0] !== userId) {
          throw new BadRequestException(
            'You can create opportunity for yourself only',
          );
        }
        // create opportunity
        const oppAcc = await this.sfService.models.accounts.create({
          Account_Name: eventTitle,
            Description: description,
            Start_Date: eventDateTime ? new Date(eventDateTime) : null,
            End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
            Phone: phone,
            Website: website,
            Venue: venue,
            Category: eventType,
            Listed_by: userId,
            opportunityScope: 'Discrete',
            Visibility: 'Available',
            Account_Record_Type: recordTypeId[0].Account_Record_Type,
            Created_at: new Date(),
            Approval_Status: 'Approved',
          }, 
          instituteId
        );
        // created self consideration
        await this.sfService.models.opportunities.create({
          Contact: userId,
          Account: oppAcc['id'],
        }, instituteId);
        notificationTitle = `opportunity ${eventTitle}`;
        notificationMsg = `${eventTitle} opportunity created for you`;
        // try {
        //   // create push notification
        //   await this.firebaseService.sendNotification(
        //     userId,
        //     notificationTitle,
        //     notificationMsg,
        //     {
        //       data: await this.utilityService.GetOpportunityNotificationData(
        //         oppAcc['id'],
        //         userId,
        //       ),
        //       type: 'Create opportunity',
        //     },
        //   );
        // } catch (error) {
        //   console.log('error', error);
        // }
        // create notification
        await this.sfService.models.notifications.create({
          Contact: userId,
          Notification_By: userId,
          Created_at: new Date(),
          Event_type: eventType,
          Is_Read: false,
          Opportunity: oppAcc.id,
          Title: notificationMsg,
          Type: 'New Opportunity',
        }, instituteId);
        return {
          statusCode: 201,
          message: `OpportunityCreated`,
        };
      } else if (InstituteId) {
        const opportunity = await this.sfService.models.accounts.create({
          Account_Name: eventTitle,
          Description: description,
          Start_Date: eventDateTime ? new Date(eventDateTime) : null,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
          Phone: phone,
          Website: website,
          Venue: venue,
          Category: eventType,
          Listed_by: userId,
          Parent_Account: InstituteId,
          Approval_Status: 'In Review',
          Visibility: 'Available',
          opportunityScope: 'Global',
          Account_Record_Type: recordTypeId[0].Account_Record_Type,
          Created_at: new Date(),
        });
        // fetch admin
        const admins = await this.sfService.models.affiliations.get(
          'Contact.Id',
          {
            Organization: InstituteId,
            Role: 'Admin',
          },
          {}, 
          instituteId
        );
        notificationTitle = `Opportunity ${eventTitle}`;
        notificationMsg = `${eventTitle} opportunity requested for approval`;
        admins.map(async admin => {
          // create notification
          const noti = await this.sfService.models.notifications.create({
            Contact: admin.Contact.Id,
            Notification_By: userId,
            Created_at: new Date(),
            Event_type: eventType,
            Is_Read: false,
            Opportunity: opportunity.id,
            Title: notificationMsg,
            Type: 'Opportunity Approval Request',
          }, instituteId);
          // try {
          //   // create push notification
          //   await this.firebaseService.sendNotification(
          //     admin.hed__Contact__r.Id,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityApprovalNotificationData(
          //         noti.id,
          //       ),
          //       type: 'Opportunity approval',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
        });
        return {
          statusCode: 201,
          message: `OpportunityCreated`,
        };
      }
      return {
        statusCode: 400,
        message: `Failure`,
      };
    } else {
      // Except student personas
      if (assignees.length !== 0) {
        // creating discrete opportunity
        const res = await this.sfService.models.accounts.create({
          Account_Name: eventTitle,
          Description: description,
          Start_Date: eventDateTime ? new Date(eventDateTime) : null,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
          Phone: phone,
          Website: website,
          Venue: venue,
          Category: eventType,
          Listed_by: userId,
          opportunityScope: 'Discrete',
          Approval_Status: 'Approved',
          Visibility: 'Available',
          Account_Record_Type: recordTypeId[0].Account_Record_Type,
          Created_at: new Date(),
        }, instituteId);
        // assigning assignees to opportunity
        notificationTitle = `Opportunity ${eventTitle}`;
        notificationMsg = `New ${eventTitle} opportunity`;
        for (const i of assignees) {
          const result = await this.sfService.models.opportunities.create({
            Contact: i,
            Account: res.id,
          }, instituteId);
          if (result['success'] === true) {
            // try {
            //   // create push notification
            //   await this.firebaseService.sendNotification(
            //     i,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: await this.utilityService.GetOpportunityNotificationData(
            //         res['id'],
            //         userId,
            //       ),
            //       type: 'Create opportunity',
            //     },
            //   );
            // } catch (error) {
            //   console.log('error', error);
            // }
            // create notification
            await this.sfService.models.notifications.create({
              Contact: i,
              Notification_By: userId,
              Created_at: new Date(),
              Event_type: eventType,
              Is_Read: false,
              Opportunity: res.id,
              Title: notificationMsg,
              Type: 'New Opportunity',
            }, instituteId);
          }
        }
        return {
          statusCode: 201,
          message: `OpportunityCreated`,
        };
      } else if (InstituteId) {
        // creating global opportunity
        if (recordTypeName === 'Administrator') {
          await this.sfService.models.accounts.create({
            Account_Name: eventTitle,
            Description: description,
            Start_Date: eventDateTime ? new Date(eventDateTime) : null,
            End_Date: expirationDateTime
              ? new Date(expirationDateTime)
              : null,
            Phone: phone,
            Website: website,
            Venue: venue,
            Category: eventType,
            Listed_by: userId,
            Parent_Account: InstituteId,
            Approval_Status: 'Approved',
            Visibility: 'Available',
            opportunityScope: 'Global',
            Account_Record_Type: recordTypeId[0].Account_Record_Type,
            Created_at: new Date(),
          }, instituteId);
          return {
            statusCode: 201,
            message: `OpportunityCreated`,
          };
        } else {
          const opportunity = await this.sfService.models.accounts.create({
            Account_Name: eventTitle,
            Description: description,
            Start_Date: eventDateTime ? new Date(eventDateTime) : null,
            End_Date: expirationDateTime
              ? new Date(expirationDateTime)
              : null,
            Phone: phone,
            Website: website,
            Venue: venue,
            Category: eventType,
            Listed_by: userId,
            Parent_Account: InstituteId,
            Approval_Status__c: recordTypeName === 'Guardian' ? 'AdvisorReview' : 'In Review',
            Visibility: 'Available',
            opportunityScope: 'Global',
            Account_Record_Type: recordTypeId[0].Account_Record_Type,
            Created_at: new Date(),
          }, instituteId);
          if (recordTypeName === 'Guardian') {
            // fetch advisors
            const advisors = await this.sfService.models.affiliations.get(
              'Contact.Id',
              {
                Organization: InstituteId,
                Role: 'Advisor',
              },
              {}, 
              instituteId
            );
            notificationTitle = `Opportunity ${eventTitle}`;
            notificationMsg = `${eventTitle} opportunity requested for approval`;
            advisors.map(async adv => {
              // create notification
              const noti = await this.sfService.models.notifications.create({
                Contact: adv.Contact.Id,
                Notification_By: userId,
                Created_at: new Date(),
                Event_type: eventType,
                Is_Read: false,
                Opportunity: opportunity.id,
                Title: notificationMsg,
                Type: 'Opportunity Approval Request',
              }, instituteId);
              // try {
              //   // create push notification
              //   await this.firebaseService.sendNotification(
              //     adv.hed__Contact__r.Id,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: await this.utilityService.GetOpportunityApprovalNotificationData(
              //         noti.id,
              //       ),
              //       type: 'Opportunity approval',
              //     },
              //   );
              // } catch (error) {
              //   console.log('error', error);
              // }
            });
          } else {
            // fetch admin
            const admins = await this.sfService.models.affiliations.get(
              'Contact.Id',
              {
                Organization: InstituteId,
                Role: 'Admin',
              },
              {}, 
              instituteId,
            );
            notificationTitle = `Opportunity ${eventTitle}`;
            notificationMsg = `${eventTitle} opportunity requested for approval`;
            admins.map(async admin => {
              // create notification
              const noti = await this.sfService.models.notifications.create({
                Contact: admin.Contact.Id,
                Notification_By: userId,
                Created_at: new Date(),
                Event_type: eventType,
                Is_Read: false,
                Opportunity: opportunity.id,
                Title: notificationMsg,
                Type: 'Opportunity Approval Request',
              });
              // try {
              //   // create push notification
              //   await this.firebaseService.sendNotification(
              //     admin.Contact.Id,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: await this.utilityService.GetOpportunityApprovalNotificationData(
              //         noti.id,
              //       ),
              //       type: 'Opportunity approval',
              //     },
              //   );
              // } catch (error) {
              //   console.log('error', error);
              // }
            });
          }
          return {
            statusCode: 201,
            message: `OpportunityCreated`,
          };
        }
      }
    }
    return {
      statusCode: 400,
      message: `Failure`,
    };
  }

  async EditDiscreteOpportunity(
    userId: string,
    RecordType: string,
    opportunityId: string,
    opportunitiesInfoDto: OpportunitiesInfoDto,
    recipientIds: string[],
    instituteId: string,
  ) {
    const allAssignees = new Map();
    const allAlreadyAssignedUsers = new Map();
    // new assignees.
    recipientIds.map(event => {
      allAssignees.set(event, 1);
    });

    // assignees that has opp as todo.
    const connectedTodo = await this.sfService.models.todos.get('Id, Assignee', {
      Opportunit_Id: opportunityId,
    }, {}, instituteId);
    connectedTodo.map(async event => {
      allAlreadyAssignedUsers.set(event.Assignee, 1);
    });

    // assignees todo to be removed.
    const userToBeDeleted = [];
    connectedTodo.map(async event => {
      if (!allAssignees.has(event.Assignee)) userToBeDeleted.push(event.Id);
    });
    userToBeDeleted.map(async eventId => {
      // deleting todos.
      await this.sfService.models.todos.delete(eventId, instituteId);
    });

    // user discrete opportunities.
    const listedby = await this.sfService.models.accounts.get('*', {
      // Listed_by__c: userId,
      Id: opportunityId,
      opportunityScope: 'Discrete',
    }, {}, instituteId);
    // check can edit or not.
    let Flag = 0;
    listedby.map(event => {
      if (
        event.Id == opportunityId &&
        (event.Listed_by == userId || RecordType === 'Administrator')
      ) {
        if (event.Visibility != 'Removed') {
          Flag = 1;
        }
      }
    });
    if (Flag == 0) {
      throw new BadRequestException(
        `Bad request, please check the credentials.`,
      );
    }

    // creating update opportunity object.
    const oppObj = {
      Account_Name: opportunitiesInfoDto.eventTitle,
      Description: opportunitiesInfoDto.description,
      Start_Date: opportunitiesInfoDto.eventDateTime
        ? new Date(opportunitiesInfoDto.eventDateTime)
        : null,
      End_Date: opportunitiesInfoDto.expirationDateTime
        ? new Date(opportunitiesInfoDto.expirationDateTime)
        : null,
      Phone: opportunitiesInfoDto.phone,
      Website: opportunitiesInfoDto.website,
      Venue: opportunitiesInfoDto.venue,
      Category: opportunitiesInfoDto.eventType,
    };
    // updating opportunity.
    await this.sfService.models.accounts.update(oppObj, opportunityId, instituteId);

    const mapOfAssignees = new Map();
    const updateDone = new Map();

    // get discrete opp assignee.
    const ListAssignees = await this.sfService.models.opportunities.get('*', {
      Account: opportunityId,
    }, {}, instituteId);
    ListAssignees.map(event => {
      mapOfAssignees.set(event.Contact, event.Id);
    });

    if (recipientIds.length >= 1) {
      recipientIds.map(async recipientId => {
        if (mapOfAssignees.has(recipientId)) {
          updateDone.set(recipientId, '1');
        } else {
          updateDone.set(recipientId, '1');
          await this.sfService.models.opportunities.create({
            Contact: recipientId,
            Account: opportunityId,
          }, instituteId);
        }
      });
    }

    ListAssignees.map(async event => {
      if (!updateDone.has(event.Contact)) {
        const Id = mapOfAssignees.get(event.Contact);
        // Remove this user from the list of assigned user of the given opportunity
        await this.sfService.models.opportunities.delete(Id, instituteId);
      }
    });
    const notificationTitle = `Opportunity Modified`;
    const notificationMsg = `Opportunity has been edited by the creater`;
    recipientIds.map(async Id => {
      // create push notification  => Sent to Recipient
      const RecipientId = Id;
      // try {
      //   await this.firebaseService.sendNotification(
      //     RecipientId,
      //     notificationTitle,
      //     notificationMsg,
      //     {
      //       data: await this.utilityService.GetOpportunityNotificationData(
      //         opportunityId,
      //         userId,
      //       ),
      //       type: 'Create oppotunity edit',
      //     },
      //   );
      // } catch (error) {
      //   console.log('error', error);
      // }
      // create SF notification
      await this.sfService.models.notifications.create({
        Title: notificationTitle,
        Contact: RecipientId,
        Type: 'Opportunity Modified',
        Notification_By: userId,
        Created_at: new Date(),
        Is_Read: false,
        Opportunity: opportunityId 
      }, instituteId);
    });
    return { statusCode: 201, message: 'Success' };
  }

  // async changeHidingStatus(
  //   userId: string,
  //   opportunityIds: string[],
  //   hidingStatus: string,
  //   instituteId: string,
  // ) {
  //   if (hidingStatus != 'Hidden' && hidingStatus != 'Available') {
  //     throw new BadRequestException(
  //       `Bad request, you can either make it hidden or available.`,
  //     );
  //   }
  //   const Result = [];
  //   const creatorOpportunity = await this.sfService.getAccount('*', {
  //     Listed_by__c: userId,
  //   });
  //   const isPresent = {};
  //   creatorOpportunity.map(event => {
  //     isPresent[event.Id] = event;
  //   });

  //   for (const opportunityId of opportunityIds) {
  //     const tempResult = [];
  //     tempResult.push(opportunityId);
  //     if (isPresent.hasOwnProperty(opportunityId)) {
  //       if (isPresent[opportunityId].Visibility__c == 'Removed') {
  //         tempResult.push(
  //           `Event is already removed, so cannot be made Hidden or Available.`,
  //         );
  //       } else {
  //         if (hidingStatus == 'Hidden') {
  //           if (isPresent[opportunityId].Visibility__c == 'Hidden') {
  //             tempResult.push(`Event is already hidden.`);
  //           } else {
  //             await this.sfService.updateAccount(opportunityId, {
  //               Visibility__c: 'Hidden',
  //             });
  //             tempResult.push(`Event is successfully made hidden.`);
  //           }
  //         }
  //         if (hidingStatus == 'Available') {
  //           if (isPresent[opportunityId].Visibility__c == 'Available') {
  //             tempResult.push(`Event is already available.`);
  //           } else {
  //             await this.sfService.updateAccount(opportunityId, {
  //               Visibility__c: 'Available',
  //             });
  //             tempResult.push(`Event is successfully made available.`);
  //           }
  //         }
  //       }
  //     } else {
  //       tempResult.push(
  //         `Bad request, please check the credentials that you are requesting.`,
  //       );
  //     }
  //     Result.push(tempResult);
  //   }
  //   return { statusCode: 201, message: 'Success', data: Result };
  // }

  // // Soft Delete => visibilty will change to "Removed"
  // // If Discrete?: visibilty will change to "Removed"
  // // If Global?: Removal Status will change to "In Review"
  // async deleteOpportunity(
  //   userId: string,
  //   opportunityIds: string[],
  //   message: string,
  //   userType: string,
  // ) {
  //   let notificationTitle = ``;
  //   let notificationMsg = ``;
  //   const Results = [];
  //   for (let I = 0; I < opportunityIds.length; I++) {
  //     const Temp_result = [];
  //     const opportunityId = opportunityIds[I];
  //     Temp_result.push(opportunityId);
  //     // gets listed by user opportunities
  //     if (!opportunityId) {
  //       Temp_result.push("Opportunity Id can't be NULL");
  //       Results.push(Temp_result);
  //       continue;
  //     }
  //     // get creator opportunities.
  //     const listedby = await this.sfService.getAccount('*', {
  //       Listed_by__c: userId,
  //     });
  //     let Flag = 0; // opportunityId present or not present
  //     listedby.map(async event => {
  //       if (event.Id == opportunityId) {
  //         if (
  //           event.Visibility__c != 'Removed' &&
  //           event.opportunityScope__c == 'Discrete'
  //         ) {
  //           Flag = 1;
  //           // update opportunity
  //           this.sfService.updateAccount(opportunityId, {
  //             Visibility__c: 'Removed',
  //             Approval_Status__c: 'Rejected',
  //             Status_At__c: new Date(),
  //             Removal_Status__c: 'Approved',
  //             Removal_at__c: new Date(),
  //             message__c: message,
  //           });
  //           Temp_result.push('Opportunity is removed');
  //           Results.push(Temp_result);

  //           // assignees of discrete opportunity.
  //           const recipients = await this.sfService.getOpportunity('*', {
  //             Account__c: opportunityId,
  //           });
  //           // opportunity todos.
  //           const connectedTodoIds = await this.sfService.getTodo('Id', {
  //             Opportunity_Id__c: opportunityId,
  //           });
  //           notificationTitle = `Todo removed`;
  //           notificationMsg = `Todo has been removed`;
  //           connectedTodoIds.map(async event => {
  //             await this.sfService.updateTodo(event.Id, {
  //               Status__c: 'Removed',
  //               Task_Status__c: 'Closed',
  //             });
  //             try {
  //               await this.firebaseService.sendNotification(
  //                 event.Assignee__c,
  //                 notificationTitle,
  //                 notificationMsg,
  //                 {
  //                   data: await this.utilityService.GetTodoNotificationData(
  //                     event.Id,
  //                   ),
  //                   type: 'Create Todo removal',
  //                 },
  //               );
  //             } catch (error) {
  //               console.log('error', error);
  //             }
  //           });
  //           notificationTitle = `Opportunity removed`;
  //           notificationMsg = `Opportunity has been removed by the creater`;
  //           recipients.map(async event => {
  //             // create push notification  => Sent to Recipient
  //             const recipientId = event.Contact__c;
  //             try {
  //               await this.firebaseService.sendNotification(
  //                 recipientId,
  //                 notificationTitle,
  //                 notificationMsg,
  //                 {
  //                   data: await this.utilityService.GetOpportunityNotificationData(
  //                     opportunityId,
  //                     userId,
  //                   ),
  //                   type: 'Create oppotunity removal',
  //                 },
  //               );
  //             } catch (error) {
  //               console.log('error', error);
  //             }
  //             // Notifications history to be updated for delete opportunity => Discrete
  //             await this.sfService.createNotification({
  //               Type__c: 'Opportunity Removed',
  //               Title__c: notificationMsg,
  //               Opportunity__c: opportunityId,
  //               Contact__c: recipientId,
  //               Notification_By__c: userId,
  //               Created_at__c: new Date(),
  //               Is_Read__c: false,
  //             });
  //           });
  //         } else if (event.opportunityScope__c == 'Global') {
  //           Flag = 1;
  //           if (userType == 'Administrator') {
  //             await this.sfService.updateAccount(event.Id, {
  //               Removal_Status__c: 'Approved',
  //               Removal_at__c: new Date(),
  //               message__c: message,
  //             });
  //             // create push notification  => Sent to Admin
  //             notificationTitle = `Opportunity Removed`;
  //             notificationMsg = `Opportunity has been removed by the admin`;

  //             const connectedTodoIds = await this.sfService.getTodo('Id', {
  //               Opportunity_Id__c: opportunityId,
  //             });
  //             notificationTitle = `Todo removed`;
  //             notificationMsg = `Todo has been removed`;
  //             connectedTodoIds.map(async event => {
  //               await this.sfService.updateTodo(event.Id, {
  //                 Status__c: 'Removed',
  //                 Task_Status__c: 'Closed',
  //               });
  //               // firebase notification.
  //               try {
  //                 await this.firebaseService.sendNotification(
  //                   event.Assignee__c,
  //                   notificationTitle,
  //                   notificationMsg,
  //                   {
  //                     data: await this.utilityService.GetTodoNotificationData(
  //                       event.Id,
  //                     ),
  //                     type: 'Create Todo removal',
  //                   },
  //                 );
  //               } catch (error) {
  //                 console.log('error', error);
  //               }
  //             });

  //             const recipientId = userId;
  //             try {
  //               // firebase notification.
  //               await this.firebaseService.sendNotification(
  //                 recipientId,
  //                 notificationTitle,
  //                 notificationMsg,
  //                 {
  //                   data: await this.utilityService.GetOpportunityNotificationData(
  //                     event.Id,
  //                     userId,
  //                   ),
  //                   type: 'Create oppotunity edit',
  //                 },
  //               );
  //             } catch (error) {
  //               console.log('error', error);
  //             }
  //           } else {
  //             Flag = 1;
  //             if (
  //               event.Approval_Status__c === 'In Review' ||
  //               event.Approval_Status__c === 'AdvisorReview'
  //             ) {
  //               // updating opportunity.
  //               await this.sfService.updateAccount(event.Id, {
  //                 Approval_Status__c: 'Rejected',
  //                 Status_At__c: new Date(),
  //                 Removal_Status__c: 'Approved',
  //                 Removal_at__c: new Date(),
  //                 message__c: 'Removed directly',
  //               });
  //             } else if (event.Approval_Status__c === 'Approved') {
  //               // update opportunity status
  //               const getModification = event.Modification__c;
  //               await this.sfService.updateAccount(opportunityId, {
  //                 Removal_Status__c: 'In Review',
  //                 Modification__c: null,
  //                 message__c: message,
  //               });
  //               if (getModification !== null) {
  //                 await this.sfService.updateModification(getModification, {
  //                   Status__c: 'Canceled',
  //                 });
  //               }
  //               // create firebase notification.
  //               notificationTitle = `Opportunity Removal Request`;
  //               notificationMsg = `Removal Request for the Global Opportunity`;

  //               const InstituteId = event.ParentId;
  //               // fetch admin
  //               const admins = await this.sfService.getAffiliation(
  //                 'hed__Contact__r.Id',
  //                 {
  //                   hed__Account__c: InstituteId,
  //                   hed__Role__c: 'Admin',
  //                 },
  //               );
  //               admins.map(async admin => {
  //                 try {
  //                   // push notification
  //                   await this.firebaseService.sendNotification(
  //                     admin.hed__Contact__r.Id,
  //                     notificationTitle,
  //                     notificationMsg,
  //                     {
  //                       data: await this.utilityService.GetOpportunityNotificationData(
  //                         event.Id,
  //                         userId,
  //                       ),
  //                       type: 'Create opportunity removal',
  //                     },
  //                   );
  //                 } catch (error) {
  //                   console.log('error', error);
  //                 }
  //                 // create notification
  //                 await this.sfService.createNotification({
  //                   Title__c: notificationMsg,
  //                   Contact__c: admin.hed__Contact__r.Id,
  //                   Opportunity__c: opportunityId,
  //                   Type__c: 'Opportunity Removal Request',
  //                   Notification_By__c: userId,
  //                   Created_at__c: new Date(),
  //                   Is_Read__c: false,
  //                 });
  //               });
  //               Temp_result.push('Opportunity removal request is created.');
  //               Results.push(Temp_result);
  //             } else {
  //               // update opportunity status
  //               await this.sfService.updateAccount(opportunityId, {
  //                 Removal_Status__c: 'Approved',
  //                 Removal_at__c: new Date(),
  //                 message__c: message,
  //               });
  //               return {
  //                 statusCode: 200,
  //                 message: 'Opportunity Already Rejected',
  //               };
  //             }
  //           }
  //         }
  //       }
  //     });

  //     if (Flag == 0) {
  //       Temp_result.push(
  //         'Bad request, Opportunity does not exist or it is already removed.',
  //       );
  //       Results.push(Temp_result);
  //       continue;
  //     }
  //   }
  //   return { statusCode: 201, message: 'Success' };
  // }



  // /** gets enrolled and interested opportunity users
  //  *  @param {opportunityId} string opportunity id
  //  * @returns {Object} status code, message, enrolledUsers & interestedUsers
  //  */
  //  async getOpportunityUsers(
  //   userId: string,
  //   RecordType: string,
  //   opportunityId: string,
  //   instituteId: string,
  // ): Promise<any> {
  //   const opportunity = await this.sfService.models.account.get('*', {
  //     Id: opportunityId,
  //   }, {}, instituteId);

  //   // only creator or admin can access.
  //   if (
  //     opportunity[0].Listed_by == userId ||
  //     RecordType === 'Administrator'
  //   ) {
  //     // get interested users.
  //     const getInterestedUsers = await this.sfService.models.recommendations.get(
  //       'Assignee__r.Profile_Picture__c, Assignee__r.Name, Assignee__r.Record_Type_Name__c',
  //       { Event__c: opportunityId },
  //       {}, 
  //       instituteId
  //     );
  //     const interestedUsers = [];
  //     getInterestedUsers.map(interested => {
  //       interestedUsers.push({
  //         profilePicture: interested.Assignee__r.Profile_Picture__c,
  //         name: interested.Assignee__r.Name,
  //         role: interested.Assignee__r.Record_Type_Name__c,
  //       });
  //     });

  //     // get enrolled users.
  //     const getEnrolledUsers = await this.sfService.getTodo(
  //       'Assignee__r.Profile_Picture__c, Assignee__r.Name, Assignee__r.Record_Type_Name__c',
  //       { Opportunity_Id__c: opportunityId },
  //     );
  //     const enrolledUsers = [];
  //     getEnrolledUsers.map(enrolled => {
  //       enrolledUsers.push({
  //         profilePicture: enrolled.Assignee__r.Profile_Picture__c,
  //         name: enrolled.Assignee__r.Name,
  //         role: enrolled.Assignee__r.Record_Type_Name__c,
  //       });
  //     });

  //     return {
  //       statusCode: 200,
  //       message: 'Success',
  //       enrolledUsers: enrolledUsers,
  //       interestedUsers: interestedUsers,
  //     };
  //   }
  //   throw new BadRequestException(`Not Authorized!`);
  // }
}
