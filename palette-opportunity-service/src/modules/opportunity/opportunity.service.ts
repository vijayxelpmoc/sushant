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
  WishListDto,
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
import { draftInfoDto } from './dto/opportunities.dto';
import { OpportunityTodoDto } from './dtos/opportunities.dto';
import { getMappedActivityObject } from './opportunity.utils';
import { StringMap } from 'aws-lambda/trigger/cognito-user-pool-trigger/_common';
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
  async getSelfOpportunities(userId: string, instituteId: string, programId: string): Promise<any> {
    // gets listed by user global opportunities
    const listedby = await this.sfService.models.accounts.get('*', {
        Listed_by: userId,
        Program: programId,
      },
      { Created_at: -1 },
      instituteId,
    );
    
    const allOpportunities = await this.sfService.models.opportunities.get('Contact, Account',
      { Program: programId },
      {},
      instituteId,
    );

    const allInterestedUsers = await this.sfService.models.recommendations.get('Assignee, Recommended_by, Event',
      { Program: programId },
      {},
      instituteId,
    );

    const allEnrolledUsers = await this.sfService.models.todos.get(
      'Assignee, Opportunit_Id',
      { Program: programId },
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
    programId: string
  ): Promise<BasicResponse> {
    const opp = await this.sfService.models.accounts.get('*', { 
        Id: opportunityId,
        Visibility: 'Available',
        Program: programId, 
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
        Program: programId, 
      },
      {},
      instituteId,  
    );

    if (getCons.length !== 0) return { statusCode: 409, message: 'Already added!'}

    let considerationObj = {
      Assignee: userId,
      Event: opportunityId,
      Accepted: "Pending",
      Program: programId, 
    };
    const createResponse = await this.sfService.models.recommendations.create(considerationObj, instituteId);

    if (createResponse) {
      return { statusCode: 201, message: 'AddedToConsiderations'};
    } else {
      throw new BadRequestException();      
    }
  }

  // adds opportunity to todo
  async addtoTodo(userId: string, opportunityId: string, instituteId: string, programId: string): Promise<BasicResponse> {
    // fetching opportunity data
    const opp = await this.sfService.models.accounts.get('*', {
        Id: opportunityId,
        Program: programId,
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
        Program: programId,
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
        Program: programId,
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
        Program: programId,
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
          Program: programId,
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
    programId: string,
  ): Promise<BasicResponse> {
    // getting account Activity
    const recordTypeId = await this.sfService.models.accounts.get('Account_Record_Type', { Record_Type_Name: AccountActivity.ACTIVITY, Program: programId }, {}, instituteId);
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
            Program: programId,
          }, 
          instituteId
        );
        // created self consideration
        await this.sfService.models.opportunities.create({
          Contact: userId,
          Account: oppAcc['id'],
          Program: programId,
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
          Program: programId,
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
          Program: programId,
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
            Program: programId,
          }, instituteId);
          // try {
          //   // create push notification
          //   await this.firebaseService.sendNotification(
          //     admin.hed__Contact.Id,
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
          Program: programId,
        }, instituteId);
        // assigning assignees to opportunity
        notificationTitle = `Opportunity ${eventTitle}`;
        notificationMsg = `New ${eventTitle} opportunity`;
        for (const i of assignees) {
          const result = await this.sfService.models.opportunities.create({
            Contact: i,
            Account: res.id,
            Program: programId,
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
              Program: programId,
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
            Program: programId,
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
            Program: programId,
          }, instituteId);
          if (recordTypeName === 'Guardian') {
            // fetch advisors
            const advisors = await this.sfService.models.affiliations.get(
              'Contact.Id',
              {
                Organization: InstituteId,
                Role: 'Advisor',
                Program: programId,
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
                Program: programId,
              }, instituteId);
              // try {
              //   // create push notification
              //   await this.firebaseService.sendNotification(
              //     adv.hed__Contact.Id,
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
                Program: programId,
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
    programId: string,
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
      Program: programId,
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
      Program: programId,
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
      Program: programId,
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
            Program: programId,
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
        Opportunity: opportunityId,
        Program: programId, 
      }, instituteId);
    });
    return { statusCode: 201, message: 'Success' };
  }

  async changeHidingStatus(
    userId: string,
    opportunityIds: string[],
    hidingStatus: string,
    instituteId: string,
    programId: string,
  ) {
    if (hidingStatus != 'Hidden' && hidingStatus != 'Available') {
      throw new BadRequestException(
        `Bad request, you can either make it hidden or available.`,
      );
    }
    const Result = [];
    const creatorOpportunity = await this.sfService.models.accounts.get('*', {
      Listed_by: userId,
      Program: programId, 
    }, {}, instituteId);
    const isPresent = {};
    creatorOpportunity.map(event => {
      isPresent[event.Id] = event;
    });

    for (const opportunityId of opportunityIds) {
      const tempResult = [];
      tempResult.push(opportunityId);
      if (isPresent.hasOwnProperty(opportunityId)) {
        if (isPresent[opportunityId].Visibility == 'Removed') {
          tempResult.push(
            `Event is already removed, so cannot be made Hidden or Available.`,
          );
        } else {
          if (hidingStatus == 'Hidden') {
            if (isPresent[opportunityId].Visibility == 'Hidden') {
              tempResult.push(`Event is already hidden.`);
            } else {
              await this.sfService.models.accounts.update({
                Visibility: 'Hidden',
                Program: programId, 
              },
              opportunityId, instituteId);
              tempResult.push(`Event is successfully made hidden.`);
            }
          }
          if (hidingStatus == 'Available') {
            if (isPresent[opportunityId].Visibility == 'Available') {
              tempResult.push(`Event is already available.`);
            } else {
              await this.sfService.models.accounts.update({
                Visibility: 'Available',
                Program: programId, 
              }, opportunityId, instituteId);
              tempResult.push(`Event is successfully made available.`);
            }
          }
        }
      } else {
        tempResult.push(
          `Bad request, please check the credentials that you are requesting.`,
        );
      }
      Result.push(tempResult);
    }
    return { statusCode: 201, message: 'Success', data: Result };
  }

  // Soft Delete => visibilty will change to "Removed"
  // If Discrete?: visibilty will change to "Removed"
  // If Global?: Removal Status will change to "In Review"
  async deleteOpportunity(
    userId: string,
    userType: string,
    opportunityIds: string[],
    message: string,
    instituteId: string,
    programId: string,
  ) {
    let notificationTitle = ``;
    let notificationMsg = ``;
    const Results = [];
    for (let I = 0; I < opportunityIds.length; I++) {
      const Temp_result = [];
      const opportunityId = opportunityIds[I];
      Temp_result.push(opportunityId);
      // gets listed by user opportunities
      if (!opportunityId) {
        Temp_result.push("Opportunity Id can't be NULL");
        Results.push(Temp_result);
        continue;
      }
      // get creator opportunities.
      const listedby = await this.sfService.models.accounts.get('*', {
        Listed_by__c: userId,
        Program: programId,
      }, {}, instituteId);
      let Flag = 0; // opportunityId present or not present
      listedby.map(async event => {
        if (event.Id == opportunityId) {
          if (
            event.Visibility != 'Removed' &&
            event.opportunityScope == 'Discrete'
          ) {
            Flag = 1;
            // update opportunity
            await this.sfService.models.accounts.update({
              Visibility: 'Removed',
              Approval_Status: 'Rejected',
              Status_At: new Date(),
              Removal_Status: 'Approved',
              Removal_at: new Date(),
              message: message,
              Program: programId,
            }, opportunityId, instituteId);
            Temp_result.push('Opportunity is removed');
            Results.push(Temp_result);

            // assignees of discrete opportunity.
            const recipients = await this.sfService.models.opportunities.get('*', {
              Account: opportunityId,
            }, {}, instituteId);
            // opportunity todos.
            const connectedTodoIds = await this.sfService.models.todos.get('Id', {
              Opportunit_Id: opportunityId,
            }, {}, instituteId);
            notificationTitle = `Todo removed`;
            notificationMsg = `Todo has been removed`;
            connectedTodoIds.map(async event => {
              await this.sfService.models.todos.update({
                Status: 'Not Approved',
                Task_Status: 'Closed',
                Program: programId,  
              }, event.Id, instituteId);
              // try {
              //   await this.firebaseService.sendNotification(
              //     event.Assignee,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: await this.utilityService.GetTodoNotificationData(
              //         event.Id,
              //       ),
              //       type: 'Create Todo removal',
              //     },
              //   );
              // } catch (error) {
              //   console.log('error', error);
              // }
            });
            notificationTitle = `Opportunity removed`;
            notificationMsg = `Opportunity has been removed by the creater`;
            recipients.map(async event => {
              // create push notification  => Sent to Recipient
              const recipientId = event.Contact;
              // try {
              //   await this.firebaseService.sendNotification(
              //     recipientId,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: await this.utilityService.GetOpportunityNotificationData(
              //         opportunityId,
              //         userId,
              //       ),
              //       type: 'Create oppotunity removal',
              //     },
              //   );
              // } catch (error) {
              //   console.log('error', error);
              // }
              // Notifications history to be updated for delete opportunity => Discrete
              await this.sfService.models.notifications.create({
                Type: 'Opportunity Removed',
                Title: notificationMsg,
                Opportunity: opportunityId,
                Contact: recipientId,
                Notification_By: userId,
                Created_at: new Date(),
                Is_Read: false,
                Program: programId,
              }, instituteId);
            });
          } else if (event.opportunityScope == 'Global') {
            Flag = 1;
            if (userType == 'Administrator') {
              await this.sfService.models.accounts.update(event.Id, {
                Removal_Status: 'Approved',
                Removal_at: new Date(),
                message: message,
                Program: programId,
              }, {}, instituteId);
              // create push notification  => Sent to Admin
              notificationTitle = `Opportunity Removed`;
              notificationMsg = `Opportunity has been removed by the admin`;

              const connectedTodoIds = await this.sfService.models.todos.get('Id', {
                Opportunit_Id: opportunityId,
              }, {}, instituteId);
              notificationTitle = `Todo removed`;
              notificationMsg = `Todo has been removed`;
              connectedTodoIds.map(async event => {
                await this.sfService.models.todos.update({
                  Status: 'Not Approved',
                  Task_Status: 'Closed',
                  Program: programId,
                }, event.Id, instituteId);
                // // firebase notification.
                // try {
                //   await this.firebaseService.sendNotification(
                //     event.Assignee__c,
                //     notificationTitle,
                //     notificationMsg,
                //     {
                //       data: await this.utilityService.GetTodoNotificationData(
                //         event.Id,
                //       ),
                //       type: 'Create Todo removal',
                //     },
                //   );
                // } catch (error) {
                //   console.log('error', error);
                // }
              });

              const recipientId = userId;
              // try {
              //   // firebase notification.
              //   await this.firebaseService.sendNotification(
              //     recipientId,
              //     notificationTitle,
              //     notificationMsg,
              //     {
              //       data: await this.utilityService.GetOpportunityNotificationData(
              //         event.Id,
              //         userId,
              //       ),
              //       type: 'Create oppotunity edit',
              //     },
              //   );
              // } catch (error) {
              //   console.log('error', error);
              // }
            } else {
              Flag = 1;
              if (
                event.Approval_Status === 'In Review' ||
                event.Approval_Status === 'AdvisorReview'
              ) {
                // updating opportunity.
                await this.sfService.models.accounts.update({
                  Approval_Status: 'Rejected',
                  Status_At: new Date(),
                  Removal_Status: 'Approved',
                  Removal_at: new Date(),
                  message: 'Removed directly',
                  Program: programId,
                }, event.Id, instituteId);
              } else if (event.Approval_Status === 'Approved') {
                // update opportunity status
                const getModification = event.Modification__c;
                await this.sfService.models.accounts.update({
                  Removal_Status: 'In Review',
                  Modification: null,
                  message: message,
                  Program: programId,
                }, opportunityId, instituteId);
                if (getModification !== null) {
                  await this.sfService.models.modifications.update({
                    Status: 'Canceled',
                  }, getModification, instituteId);
                }
                // create firebase notification.
                notificationTitle = `Opportunity Removal Request`;
                notificationMsg = `Removal Request for the Global Opportunity`;

                const InstituteId = event.ParentId;
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
                admins.map(async admin => {
                  // try {
                  //   // push notification
                  //   await this.firebaseService.sendNotification(
                  //     admin.hed__Contact.Id,
                  //     notificationTitle,
                  //     notificationMsg,
                  //     {
                  //       data: await this.utilityService.GetOpportunityNotificationData(
                  //         event.Id,
                  //         userId,
                  //       ),
                  //       type: 'Create opportunity removal',
                  //     },
                  //   );
                  // } catch (error) {
                  //   console.log('error', error);
                  // }
                  // create notification
                  await this.sfService.models.notifications.create({
                    Title: notificationMsg,
                    Contact: admin.Contact.Id,
                    Opportunity: opportunityId,
                    Type: 'Opportunity Removal Request',
                    Notification_By: userId,
                    Created_at: new Date(),
                    Is_Read: false,
                    Program: programId,
                  }, instituteId);
                });
                Temp_result.push('Opportunity removal request is created.');
                Results.push(Temp_result);
              } else {
                // update opportunity status
                await this.sfService.models.accounts.update({
                  Removal_Status: 'Approved',
                  Removal_at: new Date(),
                  message: message,
                  Program: programId,
                }, opportunityId, instituteId);
                return {
                  statusCode: 200,
                  message: 'Opportunity Already Rejected',
                };
              }
            }
          }
        }
      });

      if (Flag == 0) {
        Temp_result.push(
          'Bad request, Opportunity does not exist or it is already removed.',
        );
        Results.push(Temp_result);
        continue;
      }
    }
    return { statusCode: 201, message: 'Success' };
  }

  async updateAllTodos(opportunityId: string, instituteId: string, programId: string) {
    const allConnectedTodos = await this.sfService.models.todos.get('*', {
      Opportunit_Id: opportunityId,
    }, {}, instituteId);
    const event = await this.sfService.models.accounts.get('*', { Id: opportunityId, Program: programId }, {}, instituteId);
    let todoObj: any = {};
    const todoIds: any = [];
    const todoAssigneesIds: any = [];
    if (allConnectedTodos.length > 0) {
      todoObj = {
        To_do: event[0]['Name'],
        Opportunit_Id: opportunityId,
        Description: event[0]['Description'],
        Complete_By: event[0]['End_Date']
          ? new Date(event[0]['End_Date'])
          : null,
        // Assignee__c: userId,
        Task_status: 'Open',
        Status: 'Approved',
        Created_at: new Date(),
        Type: event[0]['Category'],
        Event_Venue: event[0]['Venue'],
        Event_At: event[0]['Start_Date']
          ? new Date(event[0]['Start_Date'])
          : null,
      };
      allConnectedTodos.map(todo => {
        // storing todo ids.
        todoIds.push(todo.Id);
        // storing todo assignees ids.
        todoAssigneesIds.push(todo.Assignee);
      });
      // updating all todos content.
      const result = await this.sfService.models.todos.update(todoObj, todoIds, instituteId);
      if (result.success == true) {
        return { statusCode: 200, message: `Success`, data: todoAssigneesIds };
      }
      return { statusCode: 200, message: `Failure`, data: [] };
    }
    return { statusCode: 200, message: `Success`, data: todoAssigneesIds };
  }

  async createAllTodoAssigneeNotifications(
    userId: string,
    opportunityId: string,
    notificationTitle: string,
    notificationMsg: string,
    assignees: any,
    instituteId: string,
    programId: string
  ) {
    assignees.map(async assignee => {
      const recipientId = assignee;
      // try {
      //   await this.firebaseService.sendNotification(
      //     recipientId,
      //     notificationTitle,
      //     notificationMsg,
      //     {
      //       data: await this.utilityService.GetOpportunityNotificationData(
      //         opportunityId,
      //         recipientId,
      //       ),
      //       type: 'Create oppotunity edit',
      //     },
      //   );
      // } catch (error) {
      //   console.log('error', error);
      // }
      // create notification for creator
      await this.sfService.models.notifications.create({
        Title: notificationTitle,
        Contact: recipientId,
        Opportunity: opportunityId,
        Type: 'Opportunity Modified',
        Notification_By: userId,
        Created_at: new Date(),
        Is_Read: false,
        Program: programId,
      }, instituteId);
    });
    return { statusCode: 200, message: `Success` };
  }

  async EditGlobalOpportunity(
    userId: string,
    userType: string,
    opportunityId: string,
    opportunitiesInfoDto: OpportunitiesInfoDto,
    instituteId: string,
    programId: string
  ): Promise<any> {
    // check opportunity Id to proceed
    if (!opportunityId || opportunityId === '') {
      throw new BadRequestException("opportunity Id can't ne null");
    }

    // get all opportunities created by user
    const listedby = await this.sfService.models.accounts.get('*', {
      Listed_by: userId,
      opportunityScope: 'Global',
      Program: programId,
    }, {}, instituteId);

    let Flag = 0;
    listedby.map(event => {
      if (event.Id == opportunityId) {
        {
          Flag = 1;
        }
      }
    });

    // admin can also edit
    if (userType === 'Administrator') {
      Flag = 1;
    }

    // opportunity not listed by user
    if (Flag == 0) {
      throw new NotFoundException(
        `Opportunity Not Found, Please Check The Credentials.`,
      );
    }

    // check if opportunity's status is In Review
    const oppStatus = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
      Program: programId,
    }, {}, instituteId);

    if (oppStatus.length == 0) {
      throw new NotFoundException(`Opportunity Not Found!`);
    }

    if (oppStatus[0].Visibility === 'Hidden' || oppStatus[0].Visibility === 'Removed' || oppStatus[0].Removal_Status == 'Approved') {
      return {
        statusCode: 200,
        message: 'Cannot process modification, please check opportunity',
      };
    }

    if (userType == 'Administrator') {
      // creating update opp object.
      const oppObj = {
        Account_Name: opportunitiesInfoDto.eventTitle,
        Category: opportunitiesInfoDto.eventType,
        Description: opportunitiesInfoDto.description,
        End_Date: opportunitiesInfoDto.expirationDateTime
          ? new Date(opportunitiesInfoDto.expirationDateTime)
          : null,
        Start_Date: opportunitiesInfoDto.eventDateTime
          ? new Date(opportunitiesInfoDto.eventDateTime)
          : null,
        Venue: opportunitiesInfoDto.venue,
        Phone: opportunitiesInfoDto.phone,
        Website: opportunitiesInfoDto.website,
        Modification: null,
        Program: programId,
      };
      let notificationTitle = ``;
      let notificationMsg = ``;

      // modification exists.
      if (oppStatus[0].Modification !== null) {
        notificationTitle = `${oppStatus[0].Account_Name} opportunity rejected`;
        notificationMsg = `${
          oppStatus[0].Account_Name
        } opportunity has been rejected by the admin`;
        await this.sfService.models.modifications.update({
          Status: 'Rejected',
          Program: programId,
        }, oppStatus[0].Modification__c, instituteId);
      }

      // Check for opportunity removal.

      // updating opportunity.
      const result = await this.sfService.models.accounts.update(oppObj, opportunityId, instituteId);

      if (result.success == true) {
        // sending notifications.
        // create push notification for opportunity creator.
        const notificationTitle = `${oppStatus[0].Account_Name} opportunity modified`;
        const notificationMsg = `${
          oppStatus[0].Account_Name
        } opportunity has been changed by the admin`;
        const RecipientId = oppStatus[0].Listed_by;
        // try {
        //   await this.firebaseService.sendNotification(
        //     RecipientId,
        //     notificationTitle,
        //     notificationMsg,
        //     {
        //       data: await this.utilityService.GetOpportunityNotificationData(
        //         opportunityId,
        //         RecipientId,
        //       ),
        //       type: 'Create oppotunity edit',
        //     },
        //   );
        // } catch (error) {
        //   console.log('error', error);
        // }
        // SF notification for creator.
        await this.sfService.models.notifications.create({
          Title: notificationTitle,
          Contact: RecipientId,
          Opportunity: opportunityId,
          Type: 'Opportunity Modified',
          Notification_By: userId,
          Created_at: new Date(),
          Is_Read: false,
          Program: programId,
        }, instituteId);

        // updating all todos content.
        const updateResult = await this.updateAllTodos(opportunityId, instituteId, programId);

        // sending todo assignees edit notifications.
        await this.createAllTodoAssigneeNotifications(
          userId,
          opportunityId,
          notificationTitle,
          notificationMsg,
          updateResult.data,
          instituteId,
          programId,
        );
        return { statusCode: 201, message: 'Success' };
      }
      return { statusCode: 201, message: 'Failure' };
    } else {
      if (
        oppStatus[0].Approval_Status === 'In Review' ||
        oppStatus[0].Approval_Status === 'AdvisorReview'
      ) {
        // updated Account object
        const updateOppData = {
          Account_Name: opportunitiesInfoDto.eventTitle,
          Category: opportunitiesInfoDto.eventType,
          Description: opportunitiesInfoDto.description,
          End_Date: opportunitiesInfoDto.expirationDateTime
            ? new Date(opportunitiesInfoDto.expirationDateTime)
            : null,
          Start_Date: opportunitiesInfoDto.eventDateTime
            ? new Date(opportunitiesInfoDto.eventDateTime)
            : null,
          Venue: opportunitiesInfoDto.venue,
          Phone: opportunitiesInfoDto.phone,
          Website: opportunitiesInfoDto.website,
          Program: programId,
        };
        // updating opportunity
        await this.sfService.models.accounts.update(updateOppData, opportunityId, instituteId);
        // creating comment for update
        await this.sfService.models.opportunityComments.create({
          Account: opportunityId,
          Comment: 'Updated content',
          Comment_Type: 'Approval',
          Contact: userId,
          Posted_at: new Date(),
          Program: programId,
        }, instituteId);
        const institute = oppStatus[0].Parent_Account;
        // fetch admins
        const admins = await this.sfService.models.affiliations.get(
          'Contact.Id',
          {
            Organization: institute,
            Role: 'Admin',
          },
          {}, 
          instituteId
        );
        admins.map(async admin => {
          // try {
          //   // create push notification for admin
          //   await this.firebaseService.sendNotification(
          //     admin.Contact.Id,
          //     `Opportunity ${oppStatus[0].Name}`,
          //     `New comment on opportunity ${oppStatus[0].Name} by creator`,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         opportunityId,
          //         userId,
          //       ),
          //       type: 'Updated Modification opportunity',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
          // create notification for admin
          await this.sfService.models.notifications.create({
            Title: `New comment on opportunity ${
              oppStatus[0].Account_Name
            } by creator`,
            Contact: admin.Contact.Id,
            Opportunity: opportunityId,
            Type: 'New Comment',
            Notification_By: userId,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          }, instituteId);
        });
        return { statusCode: 201, message: 'Success' };
      } else if (oppStatus[0].Approval_Status === 'Approved') {
        // invalidating in-review modification requests
        const getallMods = await this.sfService.models.modifications.get('Id', {
          Opportunity_Id__c: opportunityId,
          Status__c: 'In Review',
          Program: programId,
        }, {}, instituteId);
        // const allModIds = [];
        if (getallMods.length > 0) {
          getallMods.map(async mod => {
            await this.sfService.models.modifications.update({
              Status: 'Rejected',
              Program: programId,
            }, mod.Id, instituteId);
          });
        }

        // creating modification
        const mod = await this.sfService.models.modifications.create({
          Opportunity_Id: opportunityId,
          Account_Name: opportunitiesInfoDto.eventTitle,
          Category: opportunitiesInfoDto.eventType,
          Description: opportunitiesInfoDto.description,
          End_Date: opportunitiesInfoDto.expirationDateTime
            ? new Date(opportunitiesInfoDto.expirationDateTime)
            : null,
          Start_Date: opportunitiesInfoDto.eventDateTime
            ? new Date(opportunitiesInfoDto.eventDateTime)
            : null,
          Venue: opportunitiesInfoDto.venue,
          Phone: opportunitiesInfoDto.phone,
          Website: opportunitiesInfoDto.website,
          Program: programId,
        }, instituteId);
        // updating opportunity necessary fields
        await this.sfService.models.accounts.update({
          Modification: mod.id,
          Program: programId,
        }, opportunityId, instituteId);
        const institute = oppStatus[0].Parent_Account;
        // fetch admins
        const admins = await this.sfService.models.affiliations.get(
          'Contact.Id',
          {
            Organization: institute,
            Role: 'Admin',
          },
          {}, 
          instituteId
        );
        admins.map(async admin => {
          // try {
          //   // create push notification for admin
          //   await this.firebaseService.sendNotification(
          //     admin.Contact.Id,
          //     `${oppStatus[0].Name} modification`,
          //     `New modification request`,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         opportunityId,
          //         userId,
          //       ),
          //       type: 'Create Modification opportunity',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
          // create notification for admin
          await this.sfService.models.notifications.create({
            Title: `New modification request for ${oppStatus[0].Account_Name}`,
            Contact: admin.Contact.Id,
            // Opportunity__c: opportunityId,
            Type: 'Opportunity Modification Request',
            Notification_By: userId,
            Modification: mod.id,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          }, instituteId);
        });
        return { statusCode: 201, message: 'Success' };
      }
      return {
        statusCode: 200,
        message: 'Failure, Opportunity Might Be Rejected',
      };
    }
  }

  async EditDraftOpportunity(
    userId: string,
    opportunityId: string,
    draftInfoDto: draftInfoDto,
    instituteId: string,
    programId: string
  ): Promise<any> {
    // check opportunity Id to proceed
    if (opportunityId === '' || !opportunityId) {
      throw new BadRequestException(`OpportunityId Not Found!`);
    }

    // get all opportunities created by user
    const listedby = await this.sfService.models.accounts.get('*', {
      Listed_by: userId,
      Approval_Status: 'Draft',
      Program: programId,
    }, {}, instituteId);

    let Flag = 0;
    listedby.map(event => {
      if (event.Id == opportunityId) {
        Flag = 1;
      }
    });

    // opportunity not listed by user
    if (Flag == 0) {
      return {
        statusCode: 401,
        message: 'Bad request, please check the credentials.',
      };
    }

    // check if opportunity's status is Removed
    const oppStatus = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
      Program: programId,
    }, {}, instituteId);
    if (oppStatus[0].Visibility === 'Removed') {
      return {
        statusCode: 200,
        message: 'Cannot Process Edit, Opportunity Might Be Removed!',
      };
    }

    // destructing draft Dto
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
    } = draftInfoDto;

    // opportunity object
    const oppObj = {
      Account_Name: eventTitle,
      Description: description,
      Start_Date: eventDateTime ? new Date(eventDateTime) : null,
      End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
      Created_at: new Date(),
      Phone: phone,
      Website: website,
      Venue: venue,
      Category: eventType,
      Listed_by: userId,
      Parent_Account: InstituteId.length > 0 ? InstituteId : '',
      opportunityScope:
        assignees.length > 0 || InstituteId.length > 0
          ? assignees.length > 0
            ? 'Discrete'
            : 'Global'
          : '',
      Visibility: 'Available',
      Approval_Status: 'Draft',
      Program: programId,
    };

    // updating opportunity
    const updateOpp = await this.sfService.models.accounts.update(oppObj, opportunityId, instituteId);
    // if updated
    if (updateOpp.success === true) {
      // all siiginess of dic
      const getOppAssignees = await this.sfService.models.opportunities.get(
        'Id, Contact.Id',
        {
          Account: opportunityId,
          Program: programId,
        },
        {},
        instituteId
      );

      const getOppAssigneesObj = {},
        delList = [];

      // for discrete
      if (assignees.length > 0) {
        // mapping as { contactId: Id }
        getOppAssignees.map(opp => {
          getOppAssigneesObj[opp.Contact.Id] = opp.Id;
        });

        for (const assignee of assignees) {
          if (getOppAssigneesObj.hasOwnProperty(assignee)) {
            // deleting entry if assignee still exists in assigneesList
            delete getOppAssigneesObj[assignee];
          } else {
            // create opp entry
            await this.sfService.models.opportunities.create({
              Account: opportunityId,
              Contact: assignee,
              Program: programId,
            }, instituteId);
          }
        }
        // deleting entries which are not in assigneesList
        if (Object.keys(getOppAssigneesObj).length > 0) {
          for (const [k, v] of Object.entries(getOppAssigneesObj)) {
            delList.push(v);
          }
          
          console.log("delList", delList);
          
          const del = await this.sfService.models.opportunities.delete(delList, instituteId);
          console.log('del', del);
          
        }
      }

      // for global
      if (InstituteId.length > 0 && getOppAssignees.length > 0) {
        getOppAssignees.map(opp => {
          delList.push(opp.Id);
        });
        await this.sfService.models.opportunities.delete(delList, InstituteId);
      }
      return { statusCode: 201, message: 'Success' };
    }
    return { statusCode: 400, message: 'Failure' };
  }

  // creates an opportunity
  async CreateDraftOpportunity(
    draftInfoDto: draftInfoDto,
    userId: string,
    RecordTypeName: string,
    instituteId: string,
    programId: string
  ): Promise<BasicResponse> {
    // get Activity
    const recordTypeId = await this.sfService.models.accounts.get('Account_Record_Type', {
        Record_Type_Name: AccountActivity.ACTIVITY,
        Program: programId,
      },
      {},
      instituteId,
    );

    if (recordTypeId.length === 0) {
      throw new BadRequestException(`Something went wrong!`);
    }

    // destructing Dto
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
    } = draftInfoDto;
    
    if (RecordTypeName === 'Student') {
      if (InstituteId === '' && assignees.length === 0) {
        const oppAcc = await this.sfService.models.accounts.create({
          Account_Name: eventTitle,
          Description: description,
          Start_Date: eventDateTime ? new Date(eventDateTime) : null,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
          Created_at: new Date(),
          Phone: phone,
          Website: website,
          Venue: venue,
          Category: eventType,
          Listed_by: userId,
          opportunityScope: 'Discrete',
          Visibility: 'Available',
          Approval_Status: 'Draft',
          Account_Record_Type:
            recordTypeId.length > 0 ? recordTypeId[0].Account_Record_Type : '',
          Program: programId,
        }, instituteId);

        await this.sfService.models.opportunities.create({
          Contact: userId,
          Account: oppAcc['id'],
          Program: programId,
        }, instituteId);

        return {
          statusCode: 201,
          message: `OpportunitySavedAsDraft`,
        };
      } else {
        throw new BadRequestException(
          `You Can Create Opportunity Only For Yourself!`,
        );
      }
    } else {
      
      const res = await this.sfService.models.accounts.create({
        Account_Name: eventTitle,
        Description: description,
        Start_Date: eventDateTime ? new Date(eventDateTime) : null,
        End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
        Created_at: new Date(),
        Phone: phone,
        Website: website,
        Venue: venue,
        Category: eventType,
        Listed_by: userId,
        Parent_Account: InstituteId.length > 0 ? InstituteId : '',
        opportunityScope:
          assignees.length > 0 || InstituteId.length > 0
            ? assignees.length > 0
              ? 'Discrete'
              : 'Global'
            : '',
        Approval_Status: 'Draft',
        Visibility: 'Available',
        Account_Record_Type:
          recordTypeId.length > 0 ? recordTypeId[0].Account_Record_Type : '',
        Program: programId,
      }, instituteId);
      if (assignees.length !== 0) {
        const OppAssignees = [];
        // assigning assiness to opportunity
        for (const assignee of assignees) {
          OppAssignees.push({
            Contact: assignee,
            Account: res['id'],
            Program: programId,
          });
        }
        
        if (OppAssignees.length > 0) {
          // BULK CREATE FIX
          await this.sfService.models.opportunities.create(OppAssignees, instituteId);
        }
      }
      return {
        statusCode: 201,
        message: `OpportunitySavedAsDraft`,
      };
    }
  }

  // creates an status from draft => Available / In Review
  async SetDraftOpportunityStatus(
    opportunityId: string,
    draftInfoDto: draftInfoDto,
    userId: string,
    RecordTypeName: string,
    instituteId: string,
    programId: string
  ) {
    // destructing Dto
    let {
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
    } = draftInfoDto;
    if (assignees.length == 0 || InstituteId.length == 0) {
      // throw new BadRequestException(`InstituteId Or Assignee List Required!`,);
      const Institute = await this.sfService.models.affiliations.get(
        'Organization.Id',
        {
          Contact: userId,
        },
        {},
        instituteId
      );
      if (Institute.length > 0) {
        InstituteId = Institute[0].Organization.Id;
      } else {
        throw new BadRequestException(`Something Went Wrong!`);
      }
    }

    // getting account oportunity
    const isOpportunityCreatedByThisUser = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
      Listed_by: userId,
      Approval_Status: 'Draft',
      Program: programId,
    }, {}, instituteId);
    // if not a creator of account oportunity
    if (isOpportunityCreatedByThisUser.length == 0) {
      return {
        successCode: '401',
        message: 'Bad request, provide proper credentials.',
      };
    }

    const result = await this.EditDraftOpportunity(
      userId,
      opportunityId,
      draftInfoDto,
      instituteId,
      programId
    );

    // if admin
    if (RecordTypeName === 'Administrator') {
      await this.sfService.models.accounts.update({
        Approval_Status: 'Approved',
        Program: programId,
      }, opportunityId, instituteId);
      return {
        statusCode: 201,
        message: 'Success',
      };
    }

    // getting opportunity details
    const opportunityDetails = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
    }, {}, instituteId);

    // for discrete
    if (opportunityDetails[0].opportunityScope == 'Discrete') {
      await this.sfService.models.accounts.update({
        Approval_Status: 'Approved',
        Program: programId,
      }, opportunityId, instituteId);
      return {
        statusCode: 201,
        message: 'Success',
      };
    } else if (opportunityDetails[0].opportunityScope == 'Global') {
      const updateStatus = await this.sfService.models.accounts.update({
        Approval_Status:
          RecordTypeName === 'Guardian' ? 'AdvisorReview' : 'In Review',
        Program: programId,
      }, opportunityId, instituteId);
      if (updateStatus['success'] === true) {
        let notificationTitle = ``;
        let notificationMsg = ``;
        // const InstituteId = opportunityDetails[0].ParentId;
        if (RecordTypeName === 'Guardian') {
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
          notificationTitle = `Opportunity ${opportunityDetails[0].Account_Name}`;
          notificationMsg = `${
            opportunityDetails[0].Account_Name
          } opportunity requested for approval`;
          advisors.map(async adv => {
            // try {
            //   // create push notification
            //   await this.firebaseService.sendNotification(
            //     adv.Contact.Id,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: await this.utilityService.GetOpportunityNotificationData(
            //         opportunityId,
            //         userId,
            //       ),
            //       type: 'Create opportunity',
            //     },
            //   );
            // } catch (error) {
            //   console.log('error', error);
            // }
            // create notification
            const noti = await this.sfService.models.notifications.create({
              Contact: adv.Contact.Id,
              Notification_By: userId,
              Created_at: new Date(),
              Event_type: opportunityDetails[0].Category,
              Is_Read: false,
              Opportunity: opportunityDetails[0].Id,
              Title: notificationMsg,
              Type: 'Opportunity Approval Request',
              Program: programId,
            }, instituteId);
          });
          return {
            statusCode: 201,
            message: 'Success',
          };
        } else {
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
          notificationTitle = `Opportunity ${opportunityDetails[0].Account_Name}`;
          notificationMsg = `${
            opportunityDetails[0].Account_Name
          } opportunity requested for approval`;
          admins.map(async admin => {
            // try {
            //   // create push notification
            //   await this.firebaseService.sendNotification(
            //     admin.hed__Contact.Id,
            //     notificationTitle,
            //     notificationMsg,
            //     {
            //       data: await this.utilityService.GetOpportunityNotificationData(
            //         opportunityId,
            //         userId,
            //       ),
            //       type: 'Create opportunity',
            //     },
            //   );
            // } catch (error) {
            //   console.log('error', error);
            // }
            // create notification
            const noti = await this.sfService.models.notifications.create({
              Contact: admin.Contact.Id,
              Notification_By: userId,
              Created_at: new Date(),
              Event_type: opportunityDetails[0].Category,
              Is_Read: false,
              Opportunity: opportunityDetails[0].Id,
              Title: notificationMsg,
              Type: 'Opportunity Approval Request',
              Program: programId,
            }, instituteId);
          });
          return {
            statusCode: 201,
            message: 'Success',
          };
        }
      }
      return {
        statusCode: 200,
        message: 'Failure',
      };
    }
  }

  /** gets opportunity detail
   *  @param {userId} string user id
   *  @returns {Object} status code and message and opportunity information
   */
   async getOpportunityDetail(opportunityId: string, instituteId: string, programId: string): Promise<any> {
    const res = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
      Program: programId,
    }, {}, instituteId);
    
    if (res.length === 0) {
      throw new NotFoundException();
    }

    let filteredData = null;
    if (res[0].opportunityScope === 'Discrete') {
      const assignees = await this.sfService.models.opportunities.get(
        'Contact.Id, Contact.Name, Contact.Profile_Picture',
        { 
          Account: opportunityId,
          Program: programId, 
        },
        {},
        instituteId
      );
      
      const assigneesList = [];
      assignees.map(assignee => {
        const oppassignee = {
          Id: assignee.Contact.Id,
          name: assignee.Contact.Name,
          profilePicture: assignee.Contact.Profile_Picture,
          isAssignee: true,
        };
        assigneesList.push(oppassignee);
      });
      filteredData = {
        Id: res[0]['Id'],
        eventName: res[0]['Account_Name'],
        description: res[0]['Description'],
        venue: res[0]['Venue'],
        website: res[0]['Website'],
        eventDate: res[0]['Start_Date']
          ? new Date(res[0]['Start_Date'])
          : null,
        phone: res[0]['Phone'],
        type: res[0]['Type'] || 'Others',
        visibility: res[0]['Visibility'],
        expirationDate: res[0]['End_Date']
          ? new Date(res[0]['End_Date'])
          : null,
        status: res[0]['Approval_Status'],
        assignees: assigneesList,
      };
    } else {
      // global opportunity
      filteredData = {
        Id: res[0]['Id'],
        eventName: res[0]['Account_Name'],
        description: res[0]['Description'],
        venue: res[0]['Venue'],
        website: res[0]['Website'],
        eventDate: res[0]['Start_Date']
          ? new Date(res[0]['Start_Date'])
          : null,
        phone: res[0]['Phone'],
        type: res[0]['Type'] || 'Others',
        visibility: res[0]['Visibility'],
        expirationDate: res[0]['End_Date']
          ? new Date(res[0]['End_Date'])
          : null,
        status: res[0]['Approval_Status'],
        assignees: null,
      };
    }

    return {
      statusCode: 200,
      message: 'OpportunityDetail',
      data: filteredData,
    };
  }

  async getModificationDetail(
    userId: string,
    modificationId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    // Id, Account_Name, Description, Venue, Website, Start_Date, Phone, Category, End_Date, Status
    const getModification = await this.sfService.models.modifications.get(
      'Opportunity_Id.Listed_by, Id, Account_Name, Description, Venue, Website, Start_Date, Phone, Category, End_Date, Status',
      {
        Id: modificationId,
        Program: programId,
      },
      {},
      instituteId
    );

    if (
      getModification.length == 0 ||
      getModification[0].Opportunity_Id.Listed_by !== userId
    ) {
      throw new NotFoundException(`No Modification Request Found!`);
    }

    const filterDataObj = {
      Id: getModification[0].Id,
      Name: getModification[0].Account_Name,
      description: getModification[0].Description,
      venue: getModification[0].Venue,
      website: getModification[0].Website,
      eventDate: getModification[0].Start_Date
        ? new Date(getModification[0].Start_Date)
        : null,
      phone: getModification[0].Phone,
      Type: getModification[0].Category,
      expirationDate: getModification[0].End_Date
        ? new Date(getModification[0].End_Date)
        : null,
      status: getModification[0].Status,
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: filterDataObj,
    };
  }

  async removalCancel(
    userId: string, 
    opportunityId: string,
    instituteId: string,
    programId: string,   
  ) {
    const getOpportunity = await this.sfService.models.accounts.get('Id', {
        Listed_by: userId,
        Removal_Status: 'In Review',
        Program: programId,
      }, 
      {}, 
      instituteId
    );
    let isOpportunityExist = 0;
    for (let i = 0; i < getOpportunity.length; i++) {
      if (getOpportunity[i].Id == opportunityId) {
        isOpportunityExist = 1;
      }
    }
    if (isOpportunityExist === 0) {
      throw new NotFoundException('No removal request found');
    }
    await this.sfService.models.accounts.update({
      Removal_Status: 'Canceled',
      Program: programId,
    }, opportunityId, instituteId);
    return {
      statusCode: 200,
      message: 'Success',
    };
  }

  async modificationCancel(userId: string, opportunityId: string, instituteId: string, programId: string) {
    const getOpportunity = await this.sfService.models.accounts.get('Modification', {
      Listed_by: userId,
      Id: opportunityId,
      Program: programId,
    }, {}, instituteId);
    if (getOpportunity.length === 0) {
      throw new NotFoundException();
    } else if (getOpportunity[0].Modification === null) {
      throw new NotFoundException('Modification not found');
    }

    const modificationId = getOpportunity[0].Modification;
    await this.sfService.models.modifications.update({
      Status: 'Canceled',
      Program: programId,
    }, modificationId , instituteId);
    await this.sfService.models.accounts.update({
      Modification: null,
      Program: programId,
    }, opportunityId, instituteId);
    return {
      statusCode: 200,
      message: 'Success',
    };
  }

  // gets comments based on opportunity
  async getOpportunityComments(
    userId: string,
    userType: string,
    opportunityId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    // extracting comments data
    const opportunity = await this.sfService.models.accounts.get(
      'Approval_Status, Status_At, opportunityScope, Listed_by',
      {
        Id: opportunityId,
        Program: programId,
      },
      {},
      instituteId
    );
    if (opportunity.length !== 0) {
      const commentslist = await this.sfService.models.opportunityComments.get(
        'Id, Contact.Name, Contact.Profile_Picture, Comment, Posted_at, Comment_Type',
        {
          Account: opportunityId,
          Program: programId,
        },
        {Posted_at: -1},
        instituteId
      );
      // No comments
      if (commentslist.length === 0) {
        throw new NotFoundException('No comments found');
      }
      const Status_At = new Date(opportunity[0]['Status_At']);
      const comments: any = [];
      commentslist.map(comment => {
        const Posted_at = new Date(comment.Posted_at);
        if (comment.Comment_Type == 'Approval') {
          if (
            opportunity[0]['Listed_by'] === userId ||
            userType === 'Administrator'
          ) {
            const filterDataObj = {
              Id: comment.Id,
              name: comment.Contact.Name,
              profilePicture: comment.Contact.Profile_Picture,
              comment: comment.Comment,
              posted_at: comment.Posted_at,
            };
            comments.push(filterDataObj);
          }
        } else if (comment.Comment_Type == 'Generic') {
          const filterDataObj = {
            Id: comment.Id,
            name: comment.Contact.Name,
            profilePicture: comment.Contact.Profile_Picture,
            comment: comment.Comment,
            posted_at: comment.Posted_at,
          };
          comments.push(filterDataObj);
        }
      });
      if (comments.length !== 0) {
        return {
          statusCode: 200,
          message: 'Comments on opportunity fetched successfully',
          data: comments,
        };
      } else {
        throw new NotFoundException('No Comments Available');
      }
    }
    throw new NotFoundException('Opportunity Not Found!');
  }

  // creates comment on opportunity
  async createOpportunityComment(
    userId: string,
    RecordTypeName: string,
    commentsDto: CommentsDto,
    instituteId: string,
    programId: string,
  ): Promise<BasicResponse> {
    // destructing the Dto
    const { id, comment, commentType } = commentsDto;

    // get opportunity
    const opportunity = await this.sfService.models.accounts.get(
      'Approval_Status, opportunityScope, Listed_by, Account_Name',
      {
        Id: id,
        Program: programId,
      },
      {},
      instituteId
    );
    
    // not found opportunity.
    if (opportunity.length === 0) {
      throw new NotFoundException('Opportunity not found!');
    }

    let notificationTitle = ``;
    let notificationMsg = ``;
    // if opportunity is Approved.
    //  commentType = Approval.
    // else commentType = Generic.
    if (opportunity[0]['Approval_Status'] === 'Approved') {
      // create comment.
      await this.sfService.models.opportunityComments.create({
        Comment: comment,
        Contact: userId,
        Account: id,
        Comment_Type: commentType,
        Posted_at: new Date(),
        Program: programId,
      }, instituteId);

      notificationTitle = `New comment on ${opportunity[0].Account_Name}!`;
      notificationMsg = `Comment: ${comment}`;
      // try {
      //   // create push notification for creator.
      //   await this.firebaseService.sendNotification(
      //     opportunity[0].Listed_by,
      //     notificationTitle,
      //     notificationMsg,
      //     {
      //       data: await this.utilityService.GetOpportunityNotificationData(
      //         id,
      //         opportunity[0].Listed_by,
      //       ),
      //       type: 'Create opportunity comment',
      //     },
      //   );
      // } catch (error) {
      //   console.log('error', error);
      // }
      // create SF notification.
      const res = await this.sfService.models.notifications.create({
        Title: notificationTitle,
        Type: 'New Comment',
        Opportunity: id,
        Contact: opportunity[0].Listed_by,
        Notification_By: userId,
        Created_at: new Date(),
        Is_Read: false,
        Program: programId,
      }, instituteId);
      return {
        statusCode: 201,
        message: 'Comment Created.',
      };
    } else {
      // admin || creator can comment if !Approved.
      if (
        RecordTypeName === 'Administrator' ||
        opportunity[0].Listed_by == userId
      ) {
        // create comment.
        await this.sfService.models.opportunityComments.create({
          Comment: comment,
          Contact: userId,
          Account: id,
          Comment_Type: commentType,
          Posted_at: new Date(),
          Program: programId,
        });

        if (RecordTypeName === 'Administrator') {
          notificationTitle = `New comment on ${opportunity[0].Account_Name}!`;
          notificationMsg = `Comment: ${comment}`;
          // try {
          //   // create push notification for creator.
          //   await this.firebaseService.sendNotification(
          //     opportunity[0].Listed_by__c,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetOpportunityNotificationData(
          //         id,
          //         opportunity[0].Listed_by__c,
          //       ),
          //       type: 'Create opportunity comment',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
          // create SF notification
          const res = await this.sfService.models.notifications.create({
            Title: notificationTitle,
            Type: 'New Comment',
            Opportunity: id,
            Contact: RecordTypeName === 'Administrator' ? userId : opportunity[0].Listed_by,
            Notification_By: userId,
            Created_at: new Date(),
            Is_Read: false,
            Program: programId,
          }, instituteId);
          // seperate notification for diff users >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        }
        return {
          statusCode: 201,
          message: 'Comment Created.',
        };
      }
      throw new BadRequestException(`Cannot Create Comment!`);
    }
  }

  /** adds opportunities in bulk to to do for Others
   *  @param {userId} string user id
   *  @param {assigneeId} string user id of the student the opportunities are to be recommended to
   *  @param {opportunities} string[] a list of all opportunities to be added
   * @returns {Object} status code and message
   */
   async bulkAddOpportunitiesToConsiderations(
    userId: string,
    opportunities: string[],
    instituteId: string,
    programId: string
  ) {
    const recc = await this.sfService.models.recommendations.get('*', {Assignee: userId, Program: programId}, {}, instituteId); 
    let reccObj = {};
    recc.map(cons => {
      reccObj[cons.Event] = cons.Id;
    });
    const considerations = [];
    for (let i = 0; i < opportunities.length; i++) {
      const opportunity = opportunities[i];
      const temp = await this.sfService.models.accounts.get('*', { Id: opportunity, Program: programId }, {}, instituteId);

      if (((temp[0].Approval_Status == 'Approved' && temp[0].opportunityScope == 'Global') || temp[0].opportunityScope == 'Discrete') && !reccObj.hasOwnProperty(opportunity)) {
        const obj: any = {
          Assignee: userId,
          Recommended_by: userId,
          Event: temp[0].Id,
          Accepted: 'Pending',
          Program: programId,
        };
        const createResponse = await this.sfService.models.recommendations.create(obj, instituteId);
  
        // create notification
        await this.sfService.models.notifications.create({
          Title: `Opportunity saved`,
          Contact: userId,
          Created_at: new Date(),
          Is_Read: false,
          // Notification_By: userId,
          Event_type: temp[0].Category,
          Type: 'New in Consideration',
          Recommendation: createResponse.id,
          Opportunity: opportunity,
          Program: programId,
        }, instituteId);
        considerations.push({opportunity: 'Added'});
      } else {
        considerations.push({opportunity: 'Not Added'});
      }
    }
    return {
      statusCode: 200,
      message: 'Added opportunities to recommendations!',
      data: considerations,
    };
  }

  /** adds opportunities in bulk to to do for Others
   *  @param {userId} string user id
   *  @param {assigneeId} string user id of the student the opportunities are to be recommended to
   *  @param {opportunities} string[] a list of all opportunities to be added
   * @returns {Object} status code and message
   */
  // single add - /add/todo - considerations
  // multi add - considerationId list
  async bulkAddConsiderationToToDo(userId: string, considerations: string[], instituteId: string, programId: string) {
    const todoIds = [];
    const groupId = uuidv4();
    const TodoList = [];
    const ResultList = [];
    const delReccIds = [];
    const hasTodo = await this.sfService.models.todos.get('*', {
      Assignee: userId,
      Program: programId,
      }, 
      {}, 
      instituteId
    );
    hasTodo.map(todo => {
      if (todo.Opportunit_Id !== null) {
        TodoList.push(todo.Opportunit_Id);
      }
    });
    for (let i = 0; i < considerations.length; i++) {
      // const considerationObj = [];
      const consideration = considerations[i];
      const recc = await this.sfService.models.recommendations.get('*', {
        Id: consideration,
        Assignee: userId,
        Program: programId,
      }, {}, instituteId);

      if (recc.length > 0) {
        if (TodoList.indexOf(recc[0].Event) < 0) {
          const event = await this.sfService.models.accounts.get('*', {
            Id: recc[0].Event,
            Program: programId,
          }, {}, instituteId);

          ResultList.push({
            consideration: consideration,
            status: 'Added',
          });

          const obj: any = {
            To_do: event[0]['Account_Name'],
            Opportunit_Id: recc[0].Event,
            Description: event[0]['Description'],
            Complete_By: event[0]['End_Date']
              ? new Date(event[0]['End_Date'])
              : null,
            Assignee: userId,
            Task_Status: 'Open',
            Status: 'Approved',
            Group_Id: groupId,
            Created_at: new Date(),
            Type: event[0]['Category'],
            Event_Venue: event[0]['Venue'],
            Event_At: event[0]['Start_Date']
              ? new Date(event[0]['Start_Date'])
              : null,
            Program: programId,
          };

          // considerationObj.push(obj);
          const createResponse = await this.sfService.models.todos.create(obj, instituteId);

          delReccIds.push(consideration);
          todoIds.push(createResponse.id);
        } else {
          delReccIds.push(consideration);
          ResultList.push({
            consideration: consideration,
            status: 'Not Added',
          });
        }
      } else {
        ResultList.push({
          consideration: consideration,
          status: 'No Consideration Found!',
        });
      }
    }
    if (delReccIds.length > 0) {
      const del = await this.sfService.models.recommendations.delete(delReccIds, instituteId);
    }

    return {
      groupId,
      todoIds,
      ResultList,
    };
  }

  /** adds opportunities in bulk to considerations
   *  @param {userId} string user id
   *  @param {assigneeId} string user id of the student the opportunities are to be recommended to
   *  @param {opportunities} string[] a list of all opportunities to be added
   * @returns {Object} status code and message
   */
   async shareConsideration(
    userId: string,
    opportunityIds: string[],
    assigneesIds: string[],
    instituteId: string,
    programId: string
  ) {
    if (opportunityIds.length == 0 && assigneesIds.length == 0) {
      throw new NotFoundException('Opportunity And Assignee Required');
    }
    const mapOfAlreadyRecommended = new Map();
    const mapOfAlreadyEnrolled = new Map();
    const allRecommended = await this.sfService.models.recommendations.get(
      'Assignee, Event',
      {
        Recommended_by: userId,
        Accepted: 'Pending',
        Program: programId,
      },
      {},
      instituteId
    );
    const allEnrolled = await this.sfService.models.todos.get(
      'Assignee, Opportunit_Id',
      {},
      {},
      instituteId
    );
    allRecommended.map(event => {
      const RecommendedUser = event.Assignee;
      const RecommendedOpportunity = event.Event;
      mapOfAlreadyRecommended.set(
        RecommendedUser + '_' + RecommendedOpportunity,
        1,
      );
    });
    allEnrolled.map(event => {
      const EnrolledUser = event.Assignee;
      const EnrolledOpportunity = event.Opportunit_Id;
      mapOfAlreadyEnrolled.set(EnrolledUser + '_' + EnrolledOpportunity, 1);
    });

    const unassignedUsers = [];
    const Result = [];
    if (opportunityIds.length == 1) {
      const oppid = opportunityIds[0];
      const op = await this.sfService.models.accounts.get('*', { Id: oppid }, {}, instituteId);
      if (op[0].opportunityScope === 'Discrete') {
        for (const asignId of assigneesIds) {
          // create discrete opportunity
          await this.sfService.models.opportunities.create({
            Contact: asignId,
            Account: oppid,
            Program: programId,
          }, instituteId);
          const res = await this.sfService.models.recommendations.create({
            Assignee: asignId,
            Recommended_by: userId,
            Event: oppid,
            Accepted: 'Pending',
            Created_at: new Date(),
            Program: programId,
          }, instituteId);
          const notificationTitle = `Opportunity shared by user`;
          const notificationMsg = `Opportunity has been shared by user`;
          // try {
          //   // create push notification
          //   await this.firebaseService.sendNotification(
          //     asignId,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetConsiderationNotificationData(
          //         res['id'],
          //       ),
          //       type: 'Share opportunity',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
          // create notification
          await this.sfService.models.notifications.create({
            Title: notificationTitle,
            Contact: asignId,
            Created_at: new Date(),
            Is_Read: false,
            Notification_By: userId,
            Event_type: op[0].Category,
            Type: 'New in Consideration',
            Recommendation: res.id,
            Opportunity: oppid,
            Program: programId,
          }, instituteId);
          const Message = 'Successfully Shared';
          Result.push({ oppid, asignId, Message });
        }
        return {
          statusCode: 200,
          message: 'Success',
          data: Result,
        };
      }
    }
    const getAllOpp = await this.sfService.models.accounts.get('Id, Category', {
      Id: opportunityIds,
      Program: programId,
    }, {}, instituteId);
    const oppObj = {};
    getAllOpp.map(opp => {
      oppObj[opp.Id] = opp.Category;
    });
    for (const oppId of opportunityIds) {
      const notRecommendedContactsIds = [];
      for (const asignId of assigneesIds) {
        const recommended = mapOfAlreadyRecommended.has(asignId + '_' + oppId);
        const enrolled = mapOfAlreadyEnrolled.has(asignId + '_' + oppId);
        if (recommended !== true && enrolled !== true) {
          const res = await this.sfService.models.recommendations.create({
            Assignee: asignId,
            Recommended_by: userId,
            Event: oppId,
            Accepted: 'Pending',
            Created_at: new Date(),
            Program: programId,
          }, instituteId);
          const notificationTitle = `Opportunity shared by user`;
          const notificationMsg = `Opportunity has been shared by user`;
          // try {
          //   // create push notification
          //   await this.firebaseService.sendNotification(
          //     asignId,
          //     notificationTitle,
          //     notificationMsg,
          //     {
          //       data: await this.utilityService.GetConsiderationNotificationData(
          //         res['id'],
          //       ),
          //       type: 'Share opportunity',
          //     },
          //   );
          // } catch (error) {
          //   console.log('error', error);
          // }
          // create notification
          await this.sfService.models.notifications.create({
            Title: notificationTitle,
            Contact: asignId,
            Created_at: new Date(),
            Is_Read: false,
            Notification_By: userId,
            Event_type: oppObj[oppId] || null,
            Type: 'New in Consideration',
            Recommendation: res.id,
            Opportunity: oppId,
            Program: programId,
          });
          const Message = 'Successfully Shared';
          Result.push({ oppId, asignId, Message });
        } else {
          let Message = '';
          if (enrolled) {
            Message = 'Already Enrolled';
          } else {
            Message = 'Already Recommended';
          }
          Result.push({ oppId, asignId, Message });
        }
      }
    }

    return {
      statusCode: 200,
      message: 'Success',
      data: Result,
    };
    // unshareddata: unassignedUsers,
  }

  /** bulk decline considerations (recommendations)
   *  @param {considerations} string[] a list of all consideration Ids to be dismissed
   * @returns {Object} status code and message
   */
   async bulkDismissConsiderations(considerations: string[], instituteId: string, programId: string) {
    const TodoList = [];
    const ResultList = [];
    const delReccIds = [];
    // logic for correcting some data in prod.
    const hasTodo = await this.sfService.models.todos.get('*', {
      Program: programId
    }, {}, instituteId);
    hasTodo.map(activity => {
      if (activity.Opportunit_Id !== null) {
        TodoList.push(activity.Opportunit_Id);
      }
    });
    for (let i = 0; i < considerations.length; i++) {
      const groupId = uuidv4();
      const considerationId = considerations[i];
      const consideration = await this.sfService.models.recommendations.get('*', {
        Id: considerationId,
        Program: programId,
      }, {}, instituteId);

      if (TodoList.indexOf(consideration[0].Event) < 0) {
        const createResponse = await this.sfService.models.recommendations.update(
          { 
            Accepted: 'Declined',
            Program: programId, 
          },
          considerationId,
          instituteId
        );
      } else {
        delReccIds.push(considerationId);
      }
    }

    if (delReccIds.length > 0) {
      await this.sfService.models.recommendations.delete(delReccIds, instituteId);
    }

    return {
      statusCode: 200,
      message: 'Dismissed all recommendations!',
      data: considerations,
    };
  }

  async bulkOpportunitiestoTodo(
    userId: string,
    RecordTypeName: string,
    opportunityTodoDto: OpportunityTodoDto,
    instituteId: string,
    programId: string
  ): Promise<any> {
    const { opportunityIds, assigneesIds, InstituteId } = opportunityTodoDto;
    if (assigneesIds.length === 0 && InstituteId === '') {
      throw new NotFoundException('Assignees Or Institute Id Are Mandatory');
    }
    const todoList = [];
    const resultList = [];
    const delConsIds = [];
    const ConsiderationsObj = {};
    if (assigneesIds.length !== 0) {
      for (const oppId of opportunityIds) {
        const groupId = uuidv4();
        const opp = await this.sfService.models.accounts.get('*', {
          Id: oppId,
          Program: programId,
        }, {}, instituteId);
        for (const asignId of assigneesIds) {
          const considerations = await this.sfService.models.recommendations.get(
            'Id, Event',
            {
              Assignee: asignId,
              Accepted: 'Pending',
              Program: programId,
            },
            {}, 
            instituteId
          );
          considerations.map(cons => {
            ConsiderationsObj[cons.Event] = cons.Id;
          });

          const check = await this.sfService.models.todos.get('Id', {
            Assignee: asignId,
            Opportunit_Id: oppId,
            Program: programId,
          }, {}, instituteId);
          if (check.length === 0) {
            if (ConsiderationsObj.hasOwnProperty(oppId)) {
              delConsIds.push(ConsiderationsObj[oppId]);
            }
            const todoObj = {
              To_do: opp[0].Account_Name,
              Assignee: asignId,
              Complete_By: opp[0].End_Date
                ? new Date(opp[0].End_Date)
                : null,
              Created_at: new Date(),
              Description: opp[0].Description,
              Opportunit_Id: oppId,
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
              Program: programId,
            };
            todoList.push(todoObj);
            resultList.push({
              assignee: asignId,
              opportunity: oppId,
              status: 'Added',
            });
          } else {
            resultList.push({
              assignee: asignId,
              opportunity: oppId,
              status: 'Not Added',
            });
          }
        }
      }
      if (todoList.length > 0) {
        await this.sfService.models.todos.create(todoList, instituteId);
      }
      if (delConsIds.length > 0) {
        await this.sfService.models.recommendations.delete(delConsIds);
      }
      // add notification for recepients !
      return { statusCode: 200, message: 'success', data: resultList };
    } else if (InstituteId !== '') {
      const personasIdsList = [],
        notShareIdsList = [];
      const personas = await this.sfService.models.affiliations.get(
        'Contact.Id, Contact.dev_uuid, Contact.prod_uuid',
        {
          Organization: InstituteId,
        },
        {}, 
        instituteId
      );
      personas.map(recipient => {
        if (recipient.Contact.Id !== null) {
          if (
            recipient.Contact.dev_uuid !== null &&
            recipient.Contact.prod_uuid !== null
          ) {
            personasIdsList.push(recipient.Contact.Id);
          } else {
            notShareIdsList.push(recipient.Contact.Id);
          }
        }
      });
      for (const oppId of opportunityIds) {
        const groupId = uuidv4();
        const opp = await this.sfService.models.accounts.get('*', {
          Id: oppId,
          Program: programId,
        }, {}, instituteId);
        for (const asignId of personasIdsList) {
          const considerations = await this.sfService.models.recommendations.get(
            'Id, Event',
            {
              Assignee: asignId,
              Accepted: 'Pending',
              Program: programId,
            },
            {},
            instituteId
          );
          considerations.map(cons => {
            ConsiderationsObj[cons.Event] = cons.Id;
          });
          if (opp[0].opportunityScope === 'Discrete') {
            const check = await this.sfService.models.todos.get('Id', {
              Assignee: asignId,
              Opportunit_Id: oppId,
              Program: programId,
            }, {}, instituteId);
            const discreteAssigneeList = [];
            const discreteAssignee = await this.sfService.models.opportunities.get(
              'Contact',
              { Account: oppId,
                Program: programId,
              },
              {},
              instituteId
            );
            discreteAssignee.map(assignee => {
              discreteAssigneeList.push(assignee.Contact);
            });
            if (
              check.length === 0 &&
              discreteAssigneeList.indexOf(asignId) >= 0
            ) {
              if (ConsiderationsObj.hasOwnProperty(oppId)) {
                delConsIds.push(ConsiderationsObj[oppId]);
              }
              const todoObj = {
                Assignee: asignId,
                Complete_By: opp[0].End_Date
                  ? new Date(opp[0].End_Date)
                  : null,
                Created_at: new Date(),
                Opportunit_Id: oppId,
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
                Program: programId,
              };
              todoList.push(todoObj);
              resultList.push({
                assignee: asignId,
                opportunity: oppId,
                status: 'Added',
              });
            } else {
              resultList.push({
                assignee: asignId,
                opportunity: oppId,
                status: 'Not Added',
              });
            }
          } else if (opp[0].opportunityScope__c === 'Global') {
            const check = await this.sfService.models.todos.get('Id', {
              Assignee: asignId,
              Opportunit_Id: oppId,
              Program: programId,
            }, {}, instituteId);
            if (check.length === 0) {
              if (ConsiderationsObj.hasOwnProperty(oppId)) {
                delConsIds.push(ConsiderationsObj[oppId]);
              }
              const todoObj = {
                To_do: opp[0].Account_Name,
                Assignee: asignId,
                Opportunit_Id: oppId,
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
                Program: programId,
              };
              todoList.push(todoObj);
              resultList.push({
                assignee: asignId,
                opportunity: oppId,
                status: 'Added',
              });
            } else {
              resultList.push({
                assignee: asignId,
                opportunity: oppId,
                status: 'Not Added',
              });
            }
          }
        }
        for (const assignId of notShareIdsList) {
          resultList.push({
            assignee: assignId,
            opportunity: oppId,
            status: 'Not Added',
          });
        }
      }
      if (todoList.length > 0) {
        await this.sfService.models.todos.create(todoList, instituteId);
      }
      if (delConsIds.length > 0) {
        await this.sfService.models.recommendations.delete(delConsIds, instituteId);
      }
      return { statusCode: 200, message: 'success', data: resultList };
    }
    return { statusCode: 400, message: 'failure', data: [] };
  }

  /** gets enrolled and interested opportunity users
   *  @param {opportunityId} string opportunity id
   * @returns {Object} status code, message, enrolledUsers & interestedUsers
   */
  async getOpportunityUsers(
    userId: string,
    RecordType: string,
    opportunityId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    const opportunity = await this.sfService.models.accounts.get('*', {
        Id: opportunityId,
        Program: programId,
      },
      {}, 
      instituteId
    );

    // only creator or admin can access.
    if (
      opportunity[0].Listed_by == userId ||
      RecordType === 'Administrator'
    ) {
      // get interested users.
      const getInterestedUsers = await this.sfService.models.recommendations.get(
        'Assignee.Profile_Picture, Assignee.Name, Assignee.Record_Type_Name',
        { 
          Event: opportunityId,
          Program: programId,
        },
        {}, 
        instituteId
      );
      
      const interestedUsers = [];
      getInterestedUsers.map(interested => {
        interestedUsers.push({
          profilePicture: interested.Assignee.Profile_Picture,
          name: interested.Assignee.Name,
          role: interested.Assignee.Record_Type_Name,
        });
      });

      // get enrolled users.
      const getEnrolledUsers = await this.sfService.models.todos.get(
        'Assignee.Profile_Picture, Assignee.Name, Assignee.Record_Type_Name',
        { 
          Opportunit_Id: opportunityId,
          Program: programId,
        },
        {},
        instituteId
      );

      const enrolledUsers = [];
      getEnrolledUsers.map(enrolled => {
        enrolledUsers.push({
          profilePicture: enrolled.Assignee.Profile_Picture,
          name: enrolled.Assignee.Name,
          role: enrolled.Assignee.Record_Type_Name,
        });
      });

      return {
        statusCode: 200,
        message: 'Success',
        enrolledUsers: enrolledUsers,
        interestedUsers: interestedUsers,
      };
    }
    throw new BadRequestException(`Not Authorized!`);
  }

  /**
   * this will get all the recommendations for a parent
   * @param userId - id of the user
   * returns all the recommendation for a parent
   */
   async getAdminRecommendedEvents(userId: string, instituteId: string, programId: string): Promise<any> {
    const recommendedEvents: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Event.Phone, Event.Website, Event.opportunityScope, Event.Modification, Event.Removal_Status, Accepted',
      { Assignee: userId, Accepted: 'Pending', Program: programId, },
      { Created_at: -1 },
      instituteId
    );
    if (recommendedEvents.length === 0) {
      throw new NotFoundException('No recommend events found');
    }

    const responseRecommendedRecords: any[] = [];
    const recommendationRecords = {};

    for (let i = 0; i < recommendedEvents.length; i++) {
      const r = recommendedEvents[i];
      let getmodificationStatus = null;
      if (r.Event.Modification != null) {
        const getmodification = await this.sfService.models.modifications.get(
          'Status',
          {
            Id: r.Event.Modification, 
            Program: programId,
          }, 
          {}, 
          instituteId
        );
        getmodificationStatus = getmodification[0].Status;
      }
      const responseObj = {
        Id: r.Id,
        recommendedBy: {
          Id: r.Recommended_by.Id,
          Name: r.Recommended_by ? r.Recommended_by.Name : null,
          Role: r.Recommended_by
            ? r.Recommended_by.Record_Type_Name
            : null,
        },
        event: {
          Id: r.Event.Id,
          Name: r.Event ? r.Event.Account_Name : null,
          Description: r.Event ? r.Event.Description : null,
          Category: r.Event
            ? r.Event.Category
              ? r.Event.Category
              : 'Other'
            : null,
          StartDate: r.Event ? r.Event.Start_Date : null,
          EndDate: r.Event ? r.Event.End_Date : null,
          Venue: r.Event ? r.Event.Venue : null,
          Phone: r.Event ? r.Event.Phone : null,
          Website: r.Event ? r.Event.Website : null,
          OpportunityScope: r.Event ? r.Event.opportunityScope : null,
          RemovalStatus: r.Event ? r.Event.Removal_Status : null,
          ModificationStatus: getmodificationStatus,
        },
      };

      if (!recommendationRecords[responseObj.event.Id]) {
        recommendationRecords[responseObj.event.Id] = [];
      }

      recommendationRecords[responseObj.event.Id].push(responseObj);
    }

    for (const key of Object.keys(recommendationRecords)) {
      const event = recommendationRecords[key][0].event;
      const responseObj = {
        Id: [],
        event,
        recommendedBy: [],
      };

      for (const rec of recommendationRecords[key]) {
        responseObj.Id.push(rec.Id);
        responseObj.recommendedBy.push(rec.recommendedBy);
      }

      responseRecommendedRecords.push(responseObj);
    }
    return { statusCode: 200, data: responseRecommendedRecords };
  }

  /**
   * this will get all the recommendations for a parent
   * @param userId - id of the user
   * returns all the recommendation for a parent
   */
   async getAdvisorRecommendedEvents(userId: string, instituteId: string, programId: string): Promise<any> {
    const recommendedEvents: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Event.Phone, Event.Website, Event.opportunityScope, Event.Modification, Event.Removal_Status, Accepted',
      { Assignee: userId, Accepted: 'Pending', Program: programId, },
      { Created_at: -1 },
      instituteId
    );
    if (recommendedEvents.length === 0) {
      throw new NotFoundException('No recommend events found');
    }
    const responseRecommendedRecords: any[] = [];
    const recommendationRecords = {};

    for (let i = 0; i < recommendedEvents.length; i++) {
      const r = recommendedEvents[i];
      let getmodificationStatus = null;
      if (r.Event.Modification != null) {
        const getmodification = await this.sfService.models.modifications.get(
          'Status',
          {
            Id: r.Event.Modification,
            Program: programId,
          },
          {},
          instituteId
        );
        getmodificationStatus = getmodification[0].Status;
      }

      const responseObj = {
        Id: r.Id,
        recommendedBy: {
          Id: r.Recommended_by ? r.Recommended_by.Id : null,
          Name: r.Recommended_by ? r.Recommended_by.Name : null,
          Role: r.Recommended_by
            ? r.Recommended_by.Record_Type_Name
            : null,
        },
        event: {
          Id: r.Event.Id,
          Name: r.Event ? r.Event.Account_Name : null,
          Description: r.Event ? r.Event.Description : null,
          Category: r.Event
            ? r.Event.Category
              ? r.Event.Category
              : 'Other'
            : null,
          StartDate: r.Event ? r.Event.Start_Date : null,
          EndDate: r.Event ? r.Event.End_Date : null,
          Venue: r.Event ? r.Event.Venue : null,
          Phone: r.Event ? r.Event.Phone : null,
          Website: r.Event ? r.Event.Website : null,
          OpportunityScope: r.Event ? r.Event.opportunityScope : null,
          RemovalStatus: r.Event ? r.Event.Removal_Status : null,
          ModificationStatus: getmodificationStatus,
        },
      };

      if (!recommendationRecords[responseObj.event.Id]) {
        recommendationRecords[responseObj.event.Id] = [];
      }

      recommendationRecords[responseObj.event.Id].push(responseObj);
    }

    for (const key of Object.keys(recommendationRecords)) {
      const event = recommendationRecords[key][0].event;
      const responseObj = {
        Id: [],
        event,
        recommendedBy: [],
      };

      for (const rec of recommendationRecords[key]) {
        responseObj.Id.push(rec.Id);
        responseObj.recommendedBy.push(rec.recommendedBy);
      }

      responseRecommendedRecords.push(responseObj);
    }
    return { statusCode: 200, data: responseRecommendedRecords };
  }

  /**
   * this will get all the recommendations for a students
   * @param userId - id of the user
   * returns all the recommendation for a student
   */
   async getStudentRecommendedEvents(userId: string, instituteId: string, programId: string): Promise<any> {
    const recommendedEvents: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Event.Phone, Event.Website, Event.opportunityScope, Event.Removal_Status, Event.Modification, Accepted, Created_at',
      { Assignee: userId, Accepted: 'Pending', Program: programId, },
      { Created_at: -1 },
      instituteId
    );
    if (recommendedEvents.length === 0) {
      throw new NotFoundException('no recommend events found');
    }

    const responseRecommendedRecords: any[] = [];
    const recommendationRecords = {};

    for (let i = 0; i < recommendedEvents.length; i++) {
      const r = recommendedEvents[i];
      let getmodificationStatus = null;
      if (r.Event.Modification != null) {
        const getmodification = await this.sfService.models.modifications.get(
          'Status',
          {
            Id: r.Event.Modification, 
            Program: programId,
          },
          {},
          instituteId
        );
        getmodificationStatus = getmodification[0].Status;
      }
      const responseObj = {
        Id: r.Id,
        recommendedBy: {
          Id: r.Recommended_by ? r.Recommended_by.Id : null,
          Name: r.Recommended_by ? r.Recommended_by.Name : null,
          Role: r.Recommended_by
            ? r.Recommended_by.Record_Type_Name
            : null,
        },
        event: {
          Id: r.Event.Id,
          Name: r.Event ? r.Event.Account_Name : null,
          Description: r.Event ? r.Event.Description : null,
          Category: r.Event
            ? r.Event.Category
              ? r.Event.Category
              : 'Other'
            : null,
          StartDate: r.Event ? r.Event.Start_Date : null,
          EndDate: r.Event ? r.Event.End_Date : null,
          Venue: r.Event ? r.Event.Venue : null,
          Phone: r.Event ? r.Event.Phone : null,
          Website: r.Event ? r.Event.Website : null,
          OpportunityScope: r.Event ? r.Event.opportunityScope : null,
          RemovalStatus: r.Event ? r.Event.Removal_Status : null,
          ModificationStatus: getmodificationStatus,
        },
      };

      if (!recommendationRecords[responseObj.event.Id]) {
        recommendationRecords[responseObj.event.Id] = [];
      }

      recommendationRecords[responseObj.event.Id].push(responseObj);
    }

    for (const key of Object.keys(recommendationRecords)) {
      const event = recommendationRecords[key][0].event;
      const responseObj = {
        Id: [],
        event,
        recommendedBy: [],
      };

      for (const rec of recommendationRecords[key]) {
        responseObj.Id.push(rec.Id);
        responseObj.recommendedBy.push(rec.recommendedBy);
      }

      responseRecommendedRecords.push(responseObj);
    }
    return { statusCode: 200, data: responseRecommendedRecords };
  }

  /**
   * this will get all the recommendations for a parent
   * @param userId - id of the user
   * returns all the recommendation for a parent
   */
   async getParentRecommendedEvents(userId: string, instituteId: string, programId: string): Promise<any> {
    const recommendedEvents: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Event.Phone, Event.Website, Event.opportunityScope, Event.Removal_Status, Event.Modification, Accepted, Created_at',
      { Assignee: userId, Accepted: 'Pending', Program: programId, },
      { Created_at: -1 },
      instituteId
    );
    if (recommendedEvents.length === 0) {
      throw new NotFoundException('No recommend events found');
    }

    const responseRecommendedRecords: any[] = [];
    const recommendationRecords = {};

    for (let i = 0; i < recommendedEvents.length; i++) {
      const r = recommendedEvents[i];
      let getmodificationStatus = null;
      if (r.Event.Modification != null) {
        const getmodification = await this.sfService.models.modifications.get(
          'Status__c',
          {
            Id: r.Event.Modification, 
            Program: programId,
          },
          {},
          instituteId
        );
        getmodificationStatus = getmodification[0].Status;
      }
      const responseObj = {
        Id: r.Id,
        recommendedBy: {
          Id: r.Recommended_by ? r.Recommended_by.Id : null,
          Name: r.Recommended_by ? r.Recommended_by.Name : null,
          Role: r.Recommended_by
            ? r.Recommended_by.Record_Type_Name
            : null,
        },
        event: {
          Id: r.Event.Id,
          Name: r.Event ? r.Event.Account_Name : null,
          Description: r.Event ? r.Event.Description : null,
          Category: r.Event
            ? r.Event.Category
              ? r.Event.Category
              : 'Other'
            : null,
          StartDate: r.Event ? r.Event.Start_Date : null,
          EndDate: r.Event ? r.Event.End_Date : null,
          Venue: r.Event ? r.Event.Venue : null,
          Phone: r.Event ? r.Event.Phone : null,
          Website: r.Event ? r.Event.Website : null,
          OpportunityScope: r.Event ? r.Event.opportunityScope : null,
          RemovalStatus: r.Event ? r.Event.Removal_Status : null,
          ModificationStatus: getmodificationStatus,
        },
      };
      if (!recommendationRecords[responseObj.event.Id]) {
        recommendationRecords[responseObj.event.Id] = [];
      }

      recommendationRecords[responseObj.event.Id].push(responseObj);
    }

    for (const key of Object.keys(recommendationRecords)) {
      const event = recommendationRecords[key][0].event;
      const responseObj = {
        Id: [],
        event,
        recommendedBy: [],
      };

      for (const rec of recommendationRecords[key]) {
        responseObj.Id.push(rec.Id);
        responseObj.recommendedBy.push(rec.recommendedBy);
      }

      responseRecommendedRecords.push(responseObj);
    }
    return { statusCode: 200, data: responseRecommendedRecords };
  }

  /**
   * wishlist or unlists the events from recommendations of the student
   * @param { wishListDto, userId} userId is the user, and Dto has eventID and boolean wishlist that indicate if we want to list or unlist the event
   * @returns { statusCode, message}
   */
   async wishListEvent(
    userId: string,
    wishListDto: WishListDto,
    instituteId: string,
    programId: string
  ): Promise<any> {
    const { eventId, wishList } = wishListDto;

    // getting the recommendation record if there
    const recommendedEvents: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Event.Phone, Event.Website, Event.opportunityScope, Event.Removal_Status, Event.Modification, Accepted, Created_at',
      { Assignee: userId, Event: eventId, Program: programId, },
      {},
      instituteId
    );

    if (wishList === true) {
      // checking if the recommendation is already created if it is this is an bad request
      if (recommendedEvents.length === 0) {
        // creating recommendation if there are no recommendation record
        await this.sfService.models.recommendations.create({
          Assignee: userId,
          Recommended_by: userId,
          Event: eventId,
          Accepted: 'Pending', 
          Program: programId,
        }, instituteId);
        return {
          statusCode: 200,
          message: 'event wish listed successfully!',
        };
      }
      // getting the recommendation record it to directly delete it
      const RecommendationId: string = recommendedEvents[0].Id;
      // updating recommendation when its already there
      await this.sfService.models.recommendations.update({
        Assignee: userId,
        Recommended_by: userId,
        Event: eventId,
        Accepted: 'Pending', 
        Program: programId,
      }, RecommendationId, instituteId);
      return {
        statusCode: 200,
        message: 'event wish listed successfully!',
      };
    }

    if (wishList === false) {
      // checking if a recommendation exists if not this a bad request we cant delete anything
      if (recommendedEvents.length === 0) {
        throw new BadRequestException('no wish listed event found to unlist');
      }
      // getting the recommendation record it to directly delete it
      const RecommendationId: string = recommendedEvents[0].Id;

      // deleting the recommendation
      await this.sfService.models.recommendations.update({
        Accepted: 'Declined', 
        Program: programId,
      }, RecommendationId, instituteId);
      return {
        statusCode: 200,
        message: 'event wish unlisted successfully!',
      };
    }
  }

  /**
   * Return All the {Volunteering, Arts and Sports, Social Events} Activities of the Student's Institute
   * @param studentId
   */
   async getStudentInstituteActivities(
    studentId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    const contactDetail: any[] = await this.sfService.generics.contacts.get(
      'Id, Primary_Educational_Institution',
      {
        Id: studentId, 
        Program: programId,
      },
      {},
      instituteId
    );
    if (
      contactDetail.length === 0 ||
      !contactDetail[0].Primary_Educational_Institution
    ) {
      throw new BadRequestException();
    }

    const InstituteId = contactDetail[0].Primary_Educational_Institution;
    const responseActivities = await this.getInstituteActivities(
      InstituteId,
      studentId,
      instituteId,
      programId,
    );

    return {
      statusCode: 200,
      data: responseActivities.data,
    };
  }

  async getInstituteActivities(
    InstituteId: string,
    userId: string,
    instituteId: string,
    programId: string
  ): Promise<any> {
    //  all user considerations
    const allInterestedUsers = await this.sfService.models.recommendations.get(
      'Assignee, Recommended_by, Event',
      { Program: programId },
      {},
      instituteId,
    );

    // all user todos
    const allEnrolledUsers = await this.sfService.models.todos.get(
      'Assignee, Opportunit_Id',
      { Program: programId },
      {},
      instituteId
    );

    // getting opportunities
    const allAccountsDetail = await this.sfService.models.accounts.get(
      'Id, Account_Name, Parent_Account, Description, Start_Date, End_Date, Category, Venue, ShippingAddress, Phone, Website, Listed_by, Record_Type_Name, Status, opportunityScope, Removal_Status, Approval_Status',
      {
        Record_Type_Name: ['Activity', 'activities'],
        Approval_Status: 'Approved',
        Removal_Status: [null, 'In Review', 'Rejected'],
        Visibility: 'Available', 
        Program: programId,
      },
      { Created_at: -1 },
      instituteId
    );
    const accountsDetail = [];

    allAccountsDetail.map(event => {
      if (
        (event.opportunityScope === 'Discrete' ||
          event.Approval_Status === 'Approved') &&
        event.Removal_Status !== 'Approved'
      ) {
        accountsDetail.push(event);
      }
    });
    // storing institute ids
    const instituteIds = [];
    if (InstituteId) {
      instituteIds.push(InstituteId);
    } else {
      for (const account of accountsDetail) {
        instituteIds.push(account.Parent_Account);
      }
    }

    const parentAccounts = await this.sfService.models.accounts.get('Id, Account_Name', {
      Id: instituteIds, 
      Program: programId,
    }, {}, instituteId);

    const parentAccount: any = {};

    parentAccounts.map(acc => {
      parentAccount[acc.Id] = acc.Account_Name;
    });

    if (accountsDetail.length === 0) {
      return {
        statusCode: 200,
        data: [],
      };
    }

    // storing activities id to get their resources
    const activitiesIds = [];
    const instituteActivities: any[] = [];

    // filtering activities
    accountsDetail.map(value => {
      const filterObj = getMappedActivityObject(value);
      const opportunityId = value.Id;
      const interestedUsers = [];
      const enrolledUsers = [];
      for (let k = 0; k < allInterestedUsers.length; k++) {
        if (
          allInterestedUsers[k].Recommended_by == userId &&
          allInterestedUsers[k].Event == opportunityId
        ) {
          interestedUsers.push(allInterestedUsers[k].Assignee);
        }
      }
      for (let k = 0; k < allEnrolledUsers.length; k++) {
        if (allEnrolledUsers[k].Opportunit_Id == opportunityId) {
          enrolledUsers.push(allEnrolledUsers[k].Assignee);
        }
      }
      instituteActivities.push({
        ...filterObj,
        institute: {
          Id: value.Parent_Account,
          name: parentAccount[value.Parent_Account],
        },
        interestedUsers: interestedUsers,
        enrolledUsers: enrolledUsers,
      });
      activitiesIds.push(value.Id);
    });

    // getting resources by activities id
    const resourcesData = await this.getResourcesByActivityId(activitiesIds, true, instituteId, programId);
    // adding the activity and the resources together
    const responseActivities: any[] = [];

    let wishListedActivities = {};
    let recomendedActivities = {};
    let getEnrolledInActivities = {};
    if (userId) {
      wishListedActivities = await this.getWishListedActivities(
        activitiesIds,
        userId,
        instituteId,
        programId,
      );
      recomendedActivities = await this.getRecomendedActivities(
        activitiesIds,
        userId,
        instituteId,
        programId,
      );
      getEnrolledInActivities = await this.getEnrolledInActivities(
        activitiesIds,
        userId,
        instituteId,
        programId,
      );
    }

    // adding them into task and structuring the response
    instituteActivities.map(activity => {
      // when a student is accessing the events then send wishListed Boolean and also enrolled to see if the student is already enrolled in that event
      if (userId) {
        const wishListedEvent = wishListedActivities[`${activity.activity_id}`];
        const recomendedEvent = recomendedActivities[`${activity.activity_id}`];
        const getEnrolledInEvent =
          getEnrolledInActivities[`${activity.activity_id}`];
        const filteredToDoObj = {
          activity: activity,
          wishListedEvent: wishListedEvent || false,
          recomendedEvent: recomendedEvent || true,
          enrolledEvent: getEnrolledInEvent || false,
          resources: resourcesData[`${activity.activity_id}`] || [],
        };
        responseActivities.push(filteredToDoObj);
      } else {
        // when parent advisor is accessing the events
        const filteredToDoObj = {
          activity: activity,
          resources: resourcesData[`${activity.activity_id}`] || [],
        };
        responseActivities.push(filteredToDoObj);
      }
    });
    return {
      statusCode: 200,
      data: responseActivities,
    };
  }

  /**
   * Return All the resources for the events by id
   * @param activitiesIds array of activities id
   */
   async getResourcesByActivityId(
    activitiesIds: string[],
    resourceIds: boolean,
    instituteId: string,
    programId: string,
  ): Promise<any> {
    const resources: any[] = await this.sfService.models.resourceConnections.get(
      'Id, Resource_Connection_Name, Event, Resource.Id, Resource.Resource_Name, Resource.URL, Resource.Resource_Type',
      {
        Event: activitiesIds, 
        Program: programId,
      },
      {},
      instituteId
    );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    const resourceConnectionsId = [];
    resources.map(resource => {
      const resourcesObj = {
        name: resource.Resource.Resource_Name,
        url: resource.Resource.URL,
        type: resource.Resource.Resource_Type,
      };
      // if a record with a todo task is present then add the object into it or if not create one
      const hashResource = allResource[`${resource.Event}`];
      if (hashResource) {
        hashResource.push(resourcesObj);
        allResource[`${resource.Event}`] = hashResource;
      } else {
        const Allresources = [];
        Allresources.push(resourcesObj);
        allResource[`${resource.Event}`] = Allresources;
      }
      resourceConnectionsId.push(resource.Id);
    });
    if (resourceIds === true) {
      return resourceConnectionsId;
    }
    return allResource;
  }

  /**
   * Return All the resources true for the events which are wish Listed
   * @param activitiesIds array of activities id
   */
   async getWishListedActivities(activitiesIds: string[], userId: string, instituteId: string, programId: string) {
    const wishListedActivities: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Accepted',
      {
        Assignee: userId,
        Event: activitiesIds,
        Accepted: 'Pending',
        Recommended_by: userId, 
        Program: programId,
      },
      {},
      instituteId
    );

    const wishListedActivitiesResponse = {};
    wishListedActivities.map(activityId => {
      wishListedActivitiesResponse[activityId.Event.Id] = true;
    });
    return wishListedActivitiesResponse;
  }

  async getRecomendedActivities(activitiesIds: string[], userId: string, instituteId: string, programId: string) {
    const RecomendedActivities: any[] = await this.sfService.models.recommendations.get(
      'Id, Recommendation_Name, Assignee, Recommended_by.Id, Recommended_by.Name, Recommended_by.Record_Type_Name, Event.Id, Event.Account_Name, Event.Description, Event.Start_Date, Event.End_Date, Event.Category, Event.Venue, Accepted',
      {
        Assignee: userId,
        Event: activitiesIds,
        Accepted: 'Pending', 
        Program: programId,
      },
      {},
      instituteId
    );

    const RecomendedActivitiesResponse = {};
    RecomendedActivities.map(activityId => {
      if (activityId.Recommended_by__c !== userId) {
        RecomendedActivitiesResponse[activityId.Event.Id] = true;
      }
    });
    return RecomendedActivitiesResponse;
  }

  async getEnrolledInActivities(activitiesIds: string[], userId: string, instituteId: string, programId: string) {
    const paletteActivities = await this.sfService.models.todos.get(
      'Opportunit_Id',
      {
        Assignee: userId,
        Opportunit_Id: activitiesIds, 
        Program: programId,
      },
      {},
      instituteId
    );
    const paletteActivitiesResponse = [];
    paletteActivities.map(activityId => {
      paletteActivitiesResponse[activityId.Opportunit_Id] = true;
    });
    return paletteActivitiesResponse;
  }
}
