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
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  async CreateOpportunityOtherRoles(
    OpportunitiesInfoDto: OpportunitiesInfoDto,
    userId: string,
    assigneeId: string,
    InstituteId: string,
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
    } = OpportunitiesInfoDto;

    const recordTypeId = await this.sfService.models.accounts.get(
      'Account_Record_Type',
      {
        Record_Type_Name: AccountActivity.ACTIVITY,
      },
      {},
      instituteId,
    );

    if (assigneeId) {
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
          Event_Assignee: assigneeId,
          End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
        },
        instituteId,
      );
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
    }
    return { statusCode: 201, message: Responses.OPPORTUNITY_CREATED };
  }

  /** gets all self created opportunities
   *  @param {userId} string user id
   * @returns {Object} status code and message and opportunity information
   */
  async getLinkedOpportunities(userId: string, instituteId: string) {
    const createdOpportunities = await this.sfService.models.accounts.get(
      '*',
      {
        Listed_by: userId,
      },
      {},
      instituteId,
    );

    const assignedOpportunities = await this.sfService.models.accounts.get(
      '*',
      {
        Event_Assignee: userId,
      },
      {},
      instituteId,
    );

    const filteredData = [];
    createdOpportunities.map((event) => {
      if (
        (event.Approval_Status == 'Approved' &&
          event.opportunityScope == 'Global') ||
        (event.opportunityScope == 'Discrete' &&
          event.Visibility == 'Available')
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
          expirationDate: event.End_Date ? new Date(event.End_Date) : null,
          opportunityScope: event.opportunityScope,
        };
        filteredData.push(filterDataObj);
      }
    });
    assignedOpportunities.map((event) => {
      if (
        (event.Approval_Status == 'Approved' &&
          event.opportunityScope == 'Global') ||
        (event.opportunityScope == 'Discrete' &&
          event.Visibility == 'Available')
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
          expirationDate: event.End_Date ? new Date(event.End_Date) : null,
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
    const dataExist: any = await this.sfService.models.accounts.get(
      '*',
      {
        Id: opportunityId,
      },
      {},
      instituteId,
    );

    // checking if the record user is trying to edit  whether it is been created by them
    if (dataExist[0].Listed_by !== userId)
      throw new BadRequestException(
        'you are not the creator of this opportunity.',
      );

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

    await this.sfService.models.accounts.update(opportunityId, {
      Name: eventTitle,
      Description: description,
      Venue: venue,
      Website: website,
      Start_Date: eventDateTime ? new Date(eventDateTime) : null,
      Phone: phone,
      Type: eventType,
      End_Date: expirationDateTime ? new Date(expirationDateTime) : null,
    });

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

    return { statusCode: 201, message: Responses.OPPORTUNITY_UPDATED };
  }

  /** creates an opportunity for advisor, parent, admin role
   *  @param {OpportunitiesInfoDto} OpportunitiesInfoDto details of the the opportunity
   *  @param {userId} string user id
   *  @param {assigneeId} string if the opportunity is for a user then the assignee id
   *  @param {InstituteId} string if the opportunity is for a Institute then the institute id
   * @returns {Object} status code and message
   */
  async CreateOpportunityForMultipleStudents(
    OpportunitiesInfoDto: OpportunitiesInfoDto,
    userId: string,
    assignees: string[],
    InstituteId: string,
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
    } = OpportunitiesInfoDto;

    const recordTypeId = await this.sfService.models.accounts.get(
      'Account_Record_Type',
      {
        Record_Type_Name: AccountActivity.ACTIVITY,
      },
      {},
      instituteId,
    );

    for (let i = 0; i < assignees.length - 1; i++) {
      if (assignees[i]) {
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
            Event_Assignee: assignees[i],
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
    }

    return {
      statusCode: 201,
      message: `Opportunity created for ${assignees.length} users successfully.`,
    };
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
    if (opportunities.length === 0 || !opportunities) {
      throw new NotFoundException('Opportunities Ids Required');
    }

    const ConsiderationsObj = {};
    const delConsIds = [];
    const considerations = await this.sfService.models.recommendations.get(
      'Id, Event',
      {
        Assignee: userId,
        Accepted: 'Pending',
      },
      {},
      instituteId,
    );
    considerations.map((cons) => {
      ConsiderationsObj[cons.Event] = cons.Id;
    });

    const resultList = [];
    const GetTodos = await this.sfService.models.todos.get('Opportunit_Id', {
      Assignee: userId,
    });
    const EventIds = [];
    GetTodos.map((activity) => {
      if (activity.Event__c !== null) {
        EventIds.push(activity.Event__c);
      }
    });

    // const recordTypeId = await this.sfService.getActivitiesId();
    const todoList = [];
    const activityList = [];
    for (let i = 0; i < opportunities.length; i++) {
      if (EventIds.indexOf(opportunities[i]) < 0) {
        const opp = await this.sfService.models.accounts.get(
          '*',
          {
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
          const discreteAssignee =
            await this.sfService.models.opportunities.get(
              'Contact',
              {
                Account: opportunities[i],
              },
              {},
              instituteId,
            );
          discreteAssignee.map((assignee) => {
            discreteAssigneeList.push(assignee.Contact);
          });
          if (discreteAssigneeList.indexOf(userId) > -1) {
            const todoObj = {
              Assignee: userId,
              Complete_By: opp[0].End_Date ? new Date(opp[0].End_Date) : null,
              Created_at: new Date(),
              Description: opp[0].Description,
              Event_At: opp[0].Start_Date ? new Date(opp[0].Start_Date) : null,
              Event_Venue: opp[0].Venue,
              Group_Id: groupId,
              Listed_by: opp[0].Listed_by,
              Status: 'Approved',
              Task_Status: 'Open',
              Todo_Scope: opp[0].opportunityScope,
              Type: opp[0].Category,
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
        } else if (opp[0].opportunityScope === 'Global') {
          const todoObj = {
            Assignee: userId,
            Complete_By: opp[0].End_Date ? new Date(opp[0].End_Date) : null,
            Created_at: new Date(),
            Description: opp[0].Description,
            Event_At: opp[0].Start_Date ? new Date(opp[0].Start_Date) : null,
            Event_Venue: opp[0].Venue,
            Group_Id: groupId,
            Listed_by: opp[0].Listed_by,
            Status: 'Requested',
            Task_Status: 'Open',
            Todo_Scope: opp[0].opportunityScope,
            Type: opp[0].Category,
          };
          todoList.push(todoObj);
        }
      } else {
        resultList.push({
          opportunity: opportunities[i],
          status: 'Not Added',
        });
      }
    }
    if (todoList.length > 0) {
      await this.sfService.models.todos.create(todoList, instituteId);
    }

    if (delConsIds.length > 0) {
      await this.sfService.models.recommendations.delete(
        delConsIds,
        instituteId,
      );
    }

    return {
      statusCode: 201,
      message: `Success`,
      data: resultList,
    };
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
      const createResponse = await this.sfService.models.todos.create(
        opportunityObj,
        instituteId,
      );
      // return createResponse;
      if (createResponse.every((response) => response.success)) {
        const Ids = createResponse.map((response) => response.id);
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
    const listedby = await this.sfService.models.accounts.get(
      '*',
      {
        Listed_by: userId,
      },
      { Created_at: -1 },
      instituteId,
    );

    const allOpportunities = await this.sfService.models.opportunities.get(
      'Contact, Account',
      {},
      {},
      instituteId,
    );

    const allInterestedUsers = await this.sfService.models.recommendations.get(
      'Assignee, Recommended_by, Event',
      {},
      {},
      instituteId,
    );

    const allEnrolledUsers = await this.sfService.models.todos.get(
      'Assignee, Opportunit_Id',
      {},
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
    } else {
      throw new NotFoundException('CreationsDoesNotExists!');
    }
  }

  // adds opportunity to consideration
  async addtoConsiderations(
    userId: string,
    opportunityId: string,
    instituteId: string,
  ): Promise<BasicResponse> {
    const getCons = await this.sfService.models.recommendations.get(
      'Id',
      {
        Assignee: userId,
        Event: opportunityId,
      },
      {},
      instituteId,
    );

    if (getCons.length !== 0) {
      return {
        statusCode: 409,
        message: 'Already added!',
      };
    }

    const res = await this.sfService.models.recommendations.create(
      {
        Assignee: userId,
        Event: opportunityId,
      },
      instituteId,
    );
    if (res.success == true) {
      return {
        statusCode: 201,
        message: 'AddedToConsiderations',
      };
    } else {
      throw new BadRequestException('Something went wrong!');
    }
  }

  // adds opportunity to todo
  async addtoTodo(
    userId: string,
    opportunityId: string,
    instituteId: string,
  ): Promise<BasicResponse> {
    // fetching opportunity data
    const res = await this.sfService.models.accounts.get(
      '*',
      {
        Id: opportunityId,
        Approval_Status: 'Approved',
      },
      {},
      instituteId,
    );
    // not found opportunity.
    if (res.length === 0) {
      throw new NotFoundException('Opportunity not found!');
    }

    // checking and removing considerations.
    const cons = await this.sfService.models.recommendations.get(
      'Id',
      {
        Assignee: userId,
        Event: opportunityId,
      },
      {},
      instituteId,
    );
    if (cons.length > 0) {
      cons.map(async (recc) => {
        await this.sfService.models.recommendations.delete(
          recc.Id,
          instituteId,
        );
      });
    }

    // check todo already exists
    const check = await this.sfService.models.todos.get(
      'Id',
      {
        Assignee__c: userId,
        Opportunity_Id__c: opportunityId,
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
    const todo = await this.sfService.models.todos.create(
      {
        To_do: res[0]['Account_Name'],
        Opportunity_Id: opportunityId,
        Description: res[0]['Description'],
        Complete_By: res[0]['End_Date'] ? new Date(res[0]['End_Date']) : null,
        Assignee: userId,
        Task_Status: 'Open',
        Created_at: new Date(),
        Type: res[0]['Category'],
        Event_Venue: res[0]['Venue'],
        Event_At: res[0]['Start_Date'] ? new Date(res[0]['Start_Date']) : null,
        Status: 'Approved',
      },
      instituteId,
    );
    const notificatonTitle = `Task added to Todo`;
    const notificatonMsg = `Task has been added to Todo`;
    if (res.length !== 0) {
      // try {
      //   // create push notification
      //   await this.firebaseService.sendNotification(
      //     res[0]['Listed_by__c'],
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
      await this.sfService.models.notifications.create(
        {
          Title__c: notificatonTitle,
          Contact__c: res[0].Listed_by,
          Notification_By__c: userId,
          Created_at__c: new Date(),
          Is_Read__c: false,
          Event_type__c: res[0]['Category'],
          Todo__c: todo.id,
          Type__c: 'New To-Do',
        },
        instituteId,
      );
    }
    return {
      statusCode: 201,
      message: 'AddedToToDo',
    };
  }
}
