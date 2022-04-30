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

@Injectable()
export class OpportunityService {

  private notifier: Notifier;
  constructor(private sfService: SfService) {
    this.notifier = new Notifier();
  }

  async addToConsiderations(userId: string, id: string) {
    const existingOpportunities = await this.sfService.generics.activities.get(
      'Contact__c, Event__c',
      {
        Contact__c: userId,
        Event__c: id,
      },
    );
    if (existingOpportunities && existingOpportunities.length > 0) {
      throw new BadRequestException(
        Errors.OPPORTUNITY_EXISTS_IN_CONSIDERATIONS,
      );
    }

    await this.sfService.generics.activities.create({
      // Assignee__c: userId,
      Contact__c: userId,
      Event__c: id,
    });

    return {
      statusCode: 201,
      message: Responses.ADDED_TO_CONSIDERATIONS,
    };
  }

  /*
    add opportunity to todo
    userId, considerationId
  */
  async addToTodo(userId: string, id: string) {
    const todoResponse = await this.sfService.models.accounts.get('*', {
      Id: id,
      Approval_Status__c: 'Approved',
    });

    if (!todoResponse || todoResponse.length === 0) {
      throw new NotFoundException(Errors.NO_TODO_FOUND);
    }

    const existingTodos = await this.sfService.generics.activities.get('Id', {
      Contact__c: userId,
      Event__c: id,
    });
    if (existingTodos && existingTodos.length !== 0) {
      throw new BadRequestException(Errors.TODO_EXISTS);
    }
    const todo = todoResponse[0];
    await this.sfService.models.todos.create({
      Name: todo['Name'],
      Description__c: todo['Description'],
      Complete_By__c: todo['End_Date__c'],
      Assignee__c: userId,
      Task_status__c: 'Open',
      Created_at__c: new Date(),
      Type__c: todo['Category__c'],
      Event_Venue__c: todo['Venue__c'],
      Event_At__c: todo['Start_Date__c'],
      Status__c: 'Approved',
    });

    await this.sfService.generics.activities.create({
      Contact__c: userId,
      Event__c: id,
    });

    // createNotifications (check in palette-be)
    const notificationTitle = Responses.ADDED_TO_TODO;
    const notificationMsg = Responses.ADDED_TO_TODO;

    const notificationObj = await this.sfService.models.notifications.create({
      Title__c: notificationTitle,
      Contact__c: todo['Listed_by__c'],
      Created_at__c: new Date(),
      Is_Read__c: false,
    });

    /** send Push notification */
    this.notifier.send(NotificationType.PUSH, {
      userId: userId,
      title: notificationTitle,
      body: notificationMsg,
      notificationId: notificationObj.Id,
      data: {
        data: Responses.ADDED_TO_TODO,
        type: Responses.ADDED_TO_TODO,
      },
    });

    return {
      statusCode: 201,
      message: Responses.ADDED_TO_TODO,
    };
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
    userId,
  ) {
    const opportunitiesResponse = await this.sfService.models.accounts.get(
      '*',
      {
        Id: opportunityId,
      },
    );

    if (!opportunitiesResponse || opportunitiesResponse.length === 0) {
      throw new NotFoundException(Errors.RECORD_NOT_FOUND);
    }

    if (opportunitiesResponse[0].Listed_by__c !== userId) {
      throw new BadRequestException(Errors.YOU_ARE_NOT_CREATOR);
    }

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

    await this.sfService.models.accounts.update(
      {
        Name: eventTitle,
        Description: description,
        Venue__c: venue,
        Website: website,
        Start_Date__c: eventDateTime,
        phone: phone,
        Type: eventType,
        End_Date__c: expirationDateTime,
      },
      opportunityId,
    );

    return {
      statusCode: 201,
      message: Responses.OPPORTUNITY_UPDATED,
    };
  }

  async bulkAddOpportunitiesToConsiderations(
    userId: string,
    opportunities: string[],
  ) {
    let hasErrors = false;
    opportunities.map(async (opportunityId) => {
      try {
        await this.addToConsiderations(userId, opportunityId);
      } catch (e) {
        hasErrors = true;
      }
    });

    return {
      statusCode: 200,
      message: !hasErrors
        ? Responses.ALL_ADDED_TO_CONSIDERATIONS
        : Errors.SOME_OPPORTUNITIES_NOT_ADDED,
    };
  }

  /*Most opportunities exist in the accounts model*/
  async getOpportunitiesCreatedByAuthenticatedUser(userId: string) {
    const response = await this.sfService.models.accounts.get('*', {
      Listed_by__c: userId,
    });
    if (!response || response.length === 0) {
      throw new NotFoundException(Errors.NOT_FOUND);
    }

    const opportunitiesCreatedByUser: any = [...new Set(response)];

    const res = [];
    for (const opportunity of opportunitiesCreatedByUser) {
      //check the type for this object
      const obj: CreatedByUserOpportunity = {
        Id: opportunity.Id,
        evenName: opportunity.Name,
        description: opportunity.Description,
        venue: opportunity.Venue__c,
        website: opportunity.Website,
        eventDate: opportunity.Start_Date__c,
        phone: opportunity.Phone,
        type: opportunity.Category__c || 'Others',
        visibility: opportunity.Visibility__c,
        expirationDateTime: opportunity.End_Date__c,
        status: opportunity.Approcal_Status__c,
        opportunityScope: opportunity.opportunityScope__c,
        Venue__c: opportunity.Venue__c ? opportunity.Venue__c : null,
      };

      res.push(obj);
    }

    return {
      statusCode: 200,
      message: Responses.SUCCESS,
      data: res,
    };
  }

  async getOpportunitiesFromConsiderations(userId: string) {
    const considerations = await this.sfService.generics.activities.get('*', {
      Contact__c: userId,
    });

    if (!considerations || considerations.length === 0) {
      throw new NotFoundException(Errors.NO_CONSIDERATIONS_FOUND);
    }

    const myConsiderations = [];
    for (const consideration of considerations) {
      // create type for this
      const obj: { ConsiderationId: string; Name: string; CreatedBy: string } =
        {
          ConsiderationId: consideration.Event__c,
          Name: consideration.Name,
          CreatedBy: consideration.CreatedById,
        };
      myConsiderations.push(obj);
    }
    return {
      statusCode: 200,
      message: Responses.SUCCESS,
      data: myConsiderations,
    };
  }

  async bulkAddOpportunitiesToTodo(userId: string, opportunities: string[]) {
    let hasErrors = false;

    for (const opportunity of opportunities) {
      try {
        await this.addToTodo(userId, opportunity);
      } catch (e) {
        hasErrors = true;
      }
    }

    return {
      statusCode: 200,
      message: hasErrors
        ? Errors.SOME_OPPORTUNITIES_NOT_ADDED
        : Responses.ALL_ADDED_TO_TODOS,
    };
  }

  async createDraftOpportunity(
    draftInfoDto: DraftInfoDto,
    userId: string,
    assignees: string[],
    instituteId: string,
    recordTypeName: string,
  ): Promise<BasicResponse> {
    if (!instituteId && !assignees.length) {
      const Institute = await this.sfService.models.affiliations.get(
        'hed__Account__r.Id',
        {
          hed__Contact__c: userId,
        },
      );
      instituteId = Institute[0].hed__Account__r.Id;
    }

    const recordTypeId = await this.sfService.models.accounts.get('*', {
      Record_Type_Name__c: 'activities',
    });
    // const notificationTitle = `Draft created by user`;
    // const notificationMsg = `Draft has been created by user`;
    const {
      eventTitle,
      description,
      eventDateTime,
      expirationDateTime,
      phone,
      website,
      venue,
      eventType,
    } = draftInfoDto;

    const opportunityObject = {
      Name: eventTitle,
      Description: description,
      Start_Date__c: eventDateTime ? new Date(eventDateTime) : null,
      End_Date__c: expirationDateTime ? new Date(expirationDateTime) : null,
      Created_at__c: new Date(),
      Phone: phone,
      Website: website,
      Venue__c: venue,
      Category__c: eventType,
      Listed_by__c: userId,
      opportunityScope__c: OpportunityScope.DISCRETE,
      Visibility__c: Visibility.AVAILABLE,
      Approval_Status__c: ApprovalStatus.DRAFT,
      RecordTypeId: recordTypeId[0].RecordTypeId,
    };

    if (recordTypeName === RecordTypeName.STUDENT) {
      if (assignees.length > 1 || assignees[0] !== userId) {
        throw new BadRequestException(Errors.UNAUTHORIZED_OPPORTUNITY_CREATION);
      }
      const oppAcc = await this.sfService.models.accounts.create({
        ...opportunityObject,
      });
      await this.sfService.models.opportunities.create({
        Contact__c: userId,
        Account__c: oppAcc['id'],
      });
    } else {
      if (assignees.length) {
        // creating discrete opportunity
        const res = await this.sfService.models.accounts.create({
          ...opportunityObject,
        });
        // assigning assignees to opportunity
        assignees.map(
          async (assignee) =>
            await this.sfService.models.opportunities.create({
              Contact__c: assignee,
              Account__c: res['id'],
            }),
        );
      } else {
        // Null Institute Id Should be acceptable
        // creating global opportunity
        await this.sfService.models.accounts.create({
          ...opportunityObject,
          ParentId: instituteId,
          opportunityScope__c: OpportunityScope.DISCRETE,
        });
      }
    }
    return {
      statusCode: 201,
      message: Responses.DRAFT_OPPORTUNITY_SAVED,
    };
  }

  // updates opportunity status from draft => Available / In Review
  async setDraftOpportunityStatus(opportunityId: string, userId: string) {
    const opportunityDetails = await this.sfService.models.accounts.get('*', {
      Id: opportunityId,
      Listed_by__c: userId,
    });

    if (opportunityDetails.length == 0) {
      throw new UnauthorizedException(
        Errors.UNAUTHORIZED_OPPORTUNITY_STATUS_UPDATE,
      );
    }

    const status =
      OpportunityScope.DISCRETE === opportunityDetails[0].opportunityScope__c
        ? OpportunityStatus.APPROVED
        : OpportunityStatus.IN_REVIEW;

    await this.sfService.models.accounts.update(
      {
        Status__c: status,
      },
      opportunityId,
    );
    return {
      statusCode: 201,
      message: Responses.STATUS_UPDATE,
    };
  }

  // Soft Delete => visibility will change to "Removed"
  // If Discrete?: visibility will change to "Removed"
  // If Global?: Removal Status will change to "In Review"
  async deleteOpportunity(
    userId: string,
    opportunityIds: string[],
    message: string,
    userType: string,
  ) {
    const results = [];
    opportunityIds.forEach(async (opportunityId) => {
      const tempResult = [];
      tempResult.push(opportunityId);
      // gets listed by user opportunities
      if (!opportunityId) {
        tempResult.push(Errors.NULL_OPPORTUNITY_ID);
        results.push(tempResult);
        return;
      }
      const listedBy = await this.sfService.models.accounts.get('*', {
        Listed_by__c: userId,
        // Record_Type_Name__c: 'activities',
      });
      let Flag = 0; // opportunityId present or not present
      listedBy.map(async (event) => {
        if (event.Id == opportunityId) {
          if (
            event.Visibility__c != Visibility.REMOVED &&
            event.opportunityScope__c == OpportunityScope.DISCRETE
          ) {
            Flag = 1;
            await this.sfService.models.accounts.update(
              {
                Visibility__c: Visibility.REMOVED,
                message__c: message,
              },
              opportunityId,
            );
            tempResult.push(Responses.OPPORTUNITY_REMOVED);
            results.push(tempResult);

            const recipients = await this.sfService.models.opportunities.get(
              '*',
              {
                Account__c: opportunityId,
              },
            );
            const notificationTitle = NotificationTitles.OPPORTUNITY_REMOVED;
            const notificationMsg =
              NotificationMessage.OPPORTUNITY_REMOVED_BY_CREATOR;
            recipients.map(async (event) => {
              // create push notification  => Sent to Recipient
              const recipientId = event.Contact__c;
              const notificationConfig: NotificationTypePush = {
                userId: recipientId,
                title: notificationTitle,
                body: notificationMsg,
                notificationId: uuidv4(),
                data: {
                  data: NotificationDataTexts.OPPORTUNITY_REMOVED,
                  type: NotificationDataTypes.OPPORTUNITY_REMOVED,
                },
              };
              await this.notifier.send(
                NotificationType.PUSH,
                notificationConfig,
              );
              // Notifications history to be updated for delete opportunity => Discrete
              await this.sfService.models.notifications.create({
                Type__c: notificationTitle,
                Title__c: notificationMsg,
                Opportunity__c: opportunityId,
                Contact__c: recipientId,
                Notification_By__c: userId,
                Created_at__c: new Date(),
                Is_Read__c: false,
              });
            });
          } else if (event.opportunityScope__c === OpportunityScope.GLOBAL) {
            Flag = 1;
            if (userType == RecordTypeName.ADMINISTRATOR) {
              await this.sfService.models.accounts.update(
                {
                  Removal_Status__c: RemovalStatus.APPROVED,
                  message__c: message,
                },
                event.Id,
              );
              // create push notification  => Sent to Admin
              const notificationTitle = NotificationTitles.OPPORTUNITY_REMOVED;
              const notificationMsg =
                NotificationMessage.OPPORTUNITY_REMOVED_BY_ADMIN;
              const notificationConfig = {
                userId: userId,
                title: notificationTitle,
                body: notificationMsg,
                notificationId: uuidv4(),
                notificationData: {
                  data: NotificationDataTexts.OPPORTUNITY_EDIT,
                  type: NotificationDataTexts.OPPORTUNITY_EDIT,
                },
              };
              await this.notifier.send(
                NotificationType.PUSH,
                notificationConfig,
              );
            } else {
              await this.sfService.models.accounts.update(
                {
                  Removal_Status__c: 'In Review',
                  message__c: message,
                },
                opportunityId,
              );
              // create push notification  => Sent to Admin
              const notificationTitle =
                NotificationTitles.OPPORTUNITY_REMOVE_REQUEST;
              const notificationMsg =
                NotificationMessage.OPPORTUNITY_REMOVE_REQUEST;
              const allMods = await this.sfService.models.modifications.get(
                'Id',
                {
                  Opportunity_Id__c: opportunityId,
                },
              );
              if (allMods.length > 0) {
                allMods.map(async (data) => {
                  await this.sfService.models.modifications.update(
                    {
                      Valid__c: false,
                    },
                    data.Id,
                  );
                });
              }
              const instituteId = event.ParentId;
              // fetch admin
              const admins = await this.sfService.models.affiliations.get(
                'hed__Contact__r.Id',
                {
                  hed__Account__c: instituteId,
                  hed__Role__c: Roles.ADMIN,
                },
              );
              admins.map(async (admin) => {
                const notificationConfig = {
                  userId: admin.hed__Contact__r.Id,
                  title: notificationTitle,
                  body: notificationMsg,
                  notificationId: uuidv4(),
                  notificationData: {
                    data: NotificationDataTexts.OPPORTUNITY_REMOVED,
                    type: NotificationDataTypes.OPPORTUNITY_REMOVED,
                  },
                };
                await this.notifier.send(
                  NotificationType.PUSH,
                  notificationConfig,
                );
                // create notification
                await this.sfService.models.notifications.create({
                  Type__c: notificationTitle,
                  Title__c: notificationMsg,
                  Contact__c: admin.hed__Contact__r.Id,
                  Opportunity__c: opportunityId,
                  Notification_By__c: userId,
                  Created_at__c: new Date(),
                  Is_Read__c: false,
                });
              });
              tempResult.push(Responses.OPPORTUNITY_REMOVAL_REQUEST_CREATED);
              results.push(tempResult);
            }
          } else {
          }
        }
      });

      if (Flag == 0) {
        tempResult.push(Errors.INVALID_OPPORTUNITY_REMOVAL_REQUEST);
        results.push(tempResult);
        return;
      }
    });

    return {
      statusCode: 201,
      message: Responses.OPPORTUNITY_REMOVAL_REQUEST_CREATED,
    };
  }

  // gets comments based on opportunity
  async getOpportunityComments(
    userId: string,
    userType: string,
    opportunityId: string,
  ): Promise<AllCommentsDto> {
    // extracting comments data
    const opportunity = await this.sfService.models.accounts.get(
      ' Approval_Status__c, Status_At__c, opportunityScope__c, Listed_by__c',
      {
        Id: opportunityId,
      },
    );

    if (opportunity.length !== 0) {
      const commentsList = await this.sfService.models.opportunityComments.get(
        'Id, Contact__r.Name, Contact__r.Profile_Picture__c, Comment__c, Posted_at__c, Comment_Type__c',
        {
          Account__c: opportunityId,
        },
      );
      // No comments
      if (commentsList.length === 0) {
        throw new NotFoundException(Errors.NO_COMMENTS);
      }
      const comments: any = [];
      commentsList.map((comment) => {
        const filterDataObj = {
          Id: comment.Id,
          name: comment.Contact__r.Name,
          profilePicture: comment.Contact__r.Profile_Picture__c,
          comment: comment.Comment__c,
          posted_at: comment.Posted_at__c,
        };
        const isOpportunityListedByReqUserOrUserIsAdmin =
          opportunity[0]['Listed_by__c'] === userId ||
          userType === RecordTypeName.ADMINISTRATOR;
        if (
          comment.Comment_Type__c === CommentType.APPROVAL &&
          isOpportunityListedByReqUserOrUserIsAdmin
        ) {
          comments.push(filterDataObj);
        } else if (comment.Comment_Type__c === CommentType.GENERIC) {
          comments.push(filterDataObj);
        }
      });
      if (comments.length !== 0) {
        return {
          statusCode: 200,
          message: Responses.ALL_COMMENTS_OF_OPP,
          data: comments,
        };
      } else {
        throw new NotFoundException(Errors.NO_COMMENTS);
      }
    }
    throw new NotFoundException(Errors.INVALID_OPP);
  }

  // creates comment on opportunity
  async createOpportunityComment(
    userId: string,
    commentsDto: CommentsDto,
  ): Promise<BasicResponse> {
    // destructing the Dto
    const { id, comment, commentType } = commentsDto;

    const opportunity = await this.sfService.models.accounts.get(
      ' Approval_Status__c, opportunityScope__c, Listed_by__c',
      {
        Id: id,
      },
    );
    // not found opportunity
    if (opportunity.length === 0) {
      throw new NotFoundException(Errors.INVALID_OPP);
    }

    const notificationTitle = NotificationTitles.NEW_CREATOR_COMMENT;
    const notificationMsg = `Comment: ${comment}`;

    const notificationConfig = {
      userId: opportunity[0].Listed_by__c,
      title: notificationTitle,
      body: notificationMsg,
      notificationId: uuidv4(),
      notificationData: {
        data: NotificationDataTexts.OPPORTUNITY_COMMENT,
        type: NotificationDataTypes.OPPORTUNITY_COMMENT,
      },
    };
    await this.sfService.models.opportunityComments.create({
      Comment__c: comment,
      Contact__c: userId,
      Account__c: id,
      Comment_Type__c: commentType,
      Posted_at__c: new Date(),
    });
    await this.notifier.send(NotificationType.PUSH, notificationConfig);
    // create notification
    await this.sfService.models.notifications.create({
      Type__c: notificationTitle,
      Title__c: notificationMsg,
      Opportunity__c: id,
      Contact__c: opportunity[0].Listed_by__c,
      Notification_By__c: userId,
      Created_at__c: new Date(),
      Is_Read__c: false,
    });

    if (userId === opportunity[0].Listed_by__c) {
      const notificationTitle = NotificationTitles.NEW_ADMIN_COMMENT;

      // create push notification
      await this.notifier.send(NotificationType.PUSH, {
        ...notificationConfig,
        title: notificationTitle,
      });

      // create notification
      await this.sfService.models.notifications.create({
        Type__c: notificationTitle,
        Title__c: notificationMsg,
        Contact__c: opportunity[0].Listed_by__c,
        Created_at__c: new Date(),
        Is_Read__c: false,
      });
    }
    return {
      statusCode: 201,
      message: Responses.COMMENT_CREATED,
    };
  }

  async createOpportunity(
    opportunitiesInfoDto: OpportunitiesInfoDto,
    userId: string,
    assignees: string[],
    InstituteId: string,
    recordTypeName: string,
  ) {
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
    const recordTypeId = await this.sfService.models.activities.get();

    if (recordTypeName === RecordTypeName.STUDENT) {
      if (assignees.length !== 0) {
        if (assignees.length > 1) {
          throw new BadRequestException(
            Errors.UNAUTHORIZED_OPPORTUNITY_CREATION,
          );
        }
        if (assignees[0] !== userId) {
          throw new BadRequestException(
            Errors.UNAUTHORIZED_OPPORTUNITY_CREATION,
          );
        }
        // create opportunity
        const oppAcc = await this.sfService.models.accounts.create({
          Name: eventTitle,
          Description: description,
          Start_Date__c:
            eventDateTime !== null ? new Date(eventDateTime) : null,
          End_Date__c:
            expirationDateTime !== null ? new Date(expirationDateTime) : null,
          Phone: phone,
          Website: website,
          Venue__c: venue,
          Category__c: eventType,
          Listed_by__c: userId,
          opportunityScope__c: OpportunityScope.DISCRETE,
          Visibility__c: Visibility.AVAILABLE,
          RecordTypeId: recordTypeId[0].RecordTypeId,
          Created_at__c: new Date(),
          // Approval_Status__c: 'Approved',
        });
        // created self consideration
        await this.sfService.models.opportunities.create({
          Contact__c: userId,
          Account__c: oppAcc['id'],
        });
        const notificationTitle = `opportunity ${eventTitle}`;
        const notificationMsg = `${eventTitle} opportunity created`;
        const notificationConfig = {
          userId,
          title: notificationTitle,
          body: notificationMsg,
          notificationId: uuidv4(),
          notificationData: {
            data: NotificationDataTexts.OPPORTUNITY_CREATED,
            type: NotificationDataTypes.OPPORTUNITY_CREATED,
          },
        };
        await this.notifier.send(NotificationType.PUSH, notificationConfig);

        // create notification
        await this.sfService.models.notifications.create({
          Contact__c: userId,
          Notification_By__c: userId,
          Created_at__c: new Date(),
          Event_type__c: eventType,
          Is_Read__c: false,
          Opportunity__c: oppAcc.id,
          Title__c: notificationMsg,
          Type__c: NotificationTitles.NEW_CONSIDERATION,
        });
        return {
          statusCode: 201,
          message: Responses.OPPORTUNITY_CREATED,
        };
      } else if (InstituteId) {
        const opportunity = await this.sfService.models.accounts.create({
          Name: eventTitle,
          Description: description,
          Start_Date__c:
            eventDateTime !== null ? new Date(eventDateTime) : null,
          End_Date__c:
            expirationDateTime !== null ? new Date(expirationDateTime) : null,
          Phone: phone,
          Website: website,
          Venue__c: venue,
          Category__c: eventType,
          Listed_by__c: userId,
          ParentId: InstituteId,
          Approval_Status__c: RemovalStatus.IN_REVIEW,
          Visibility__c: Visibility.AVAILABLE,
          opportunityScope__c: OpportunityScope.GLOBAL,
          RecordTypeId: recordTypeId[0].RecordTypeId,
          Created_at__c: new Date(),
        });
        // fetch admin
        const admins = await this.sfService.models.affiliations.get(
          'hed__Contact__r.Id',
          {
            hed__Account__c: InstituteId,
            hed__Role__c: 'Admin',
          },
        );
        const notificationTitle = `Opportunity ${eventTitle}`;
        const notificationMsg = `${eventTitle}`;
        NotificationMessage.OPPORTUNITY_REQUEST_APPROVAL;
        admins.map(async (admin) => {
          // create push notification
          const notificationConfig = {
            userId: admin.hed__Contact__r.Id,
            title: notificationTitle,
            body: notificationMsg,
            notificationId: uuidv4(),
            notificationData: {
              data: NotificationDataTexts.OPPORTUNITY_CREATED,
              type: NotificationDataTypes.OPPORTUNITY_CREATED,
            },
          };
          await this.notifier.send(NotificationType.PUSH, notificationConfig);

          // create notification
          await this.sfService.models.notifications.create({
            Contact__c: admin.hed__Contact__r.Id,
            Notification_By__c: userId,
            Created_at__c: new Date(),
            Event_type__c: eventType,
            Is_Read__c: false,
            Opportunity__c: opportunity.id,
            Title__c: notificationMsg,
            Type__c: NotificationTitles.OPPORTUNITY_APPROVAL_REQUEST,
          });
        });
        return {
          statusCode: 201,
          message: Responses.OPPORTUNITY_CREATED,
        };
      }

      throw new BadRequestException(Errors.FAILED);
    } else {
      // Except student personas
      if (assignees.length !== 0) {
        // creating discrete opportunity
        const res = await this.sfService.models.accounts.create({
          Name: eventTitle,
          Description: description,
          Start_Date__c:
            eventDateTime !== null ? new Date(eventDateTime) : null,
          End_Date__c:
            expirationDateTime !== null ? new Date(expirationDateTime) : null,
          Phone: phone,
          Website: website,
          Venue__c: venue,
          Category__c: eventType,
          Listed_by__c: userId,
          opportunityScope__c: OpportunityScope.DISCRETE,
          // Approval_Status__c: 'Approved',
          Visibility__c: Visibility.AVAILABLE,
          RecordTypeId: recordTypeId[0].RecordTypeId,
          Created_at__c: new Date(),
        });
        // assigning assignees to opportunity
        const notificationTitle = `Opportunity ${eventTitle}`;
        const notificationMsg = `Added ${eventTitle} opportunity in consideration`;
        for (const i of assignees) {
          const result = await this.sfService.models.opportunities.create({
            Contact__c: i,
            Account__c: res.id,
          });
          if (result.length !== 0) {
            const notificationConfig = {
              userId: i,
              title: notificationTitle,
              body: notificationMsg,
              notificationId: uuidv4(),
              notificationData: {
                data: NotificationDataTexts.OPPORTUNITY_REMOVED,
                type: NotificationDataTypes.OPPORTUNITY_CREATED,
              },
            };
            await this.notifier.send(NotificationType.PUSH, notificationConfig);

            // create notification
            await this.sfService.models.notifications.create({
              Contact__c: i,
              Notification_By__c: userId,
              Created_at__c: new Date(),
              Event_type__c: eventType,
              Is_Read__c: false,
              Opportunity__c: res.id,
              Title__c: notificationMsg,
              Type__c: NotificationTitles.NEW_CONSIDERATION,
            });
          }
        }
        return {
          statusCode: 201,
          message: Responses.OPPORTUNITY_CREATED,
        };
      } else if (InstituteId) {
        // creating global opportunity
        if (recordTypeName === RecordTypeName.ADMINISTRATOR) {
          await this.sfService.models.accounts.create({
            Name: eventTitle,
            Description: description,
            Start_Date__c:
              eventDateTime !== null ? new Date(eventDateTime) : null,
            End_Date__c:
              expirationDateTime !== null ? new Date(expirationDateTime) : null,
            Phone: phone,
            Website: website,
            Venue__c: venue,
            Category__c: eventType,
            Listed_by__c: userId,
            ParentId: InstituteId,
            Approval_Status__c: ApprovalStatus.APPROVED,
            Visibility__c: Visibility.AVAILABLE,
            opportunityScope__c: OpportunityScope.GLOBAL,
            RecordTypeId: recordTypeId[0].RecordTypeId,
            Created_at__c: new Date(),
          });
          return {
            statusCode: 201,
            message: NotificationMessage.OPPORTUNITY_CREATED,
          };
        } else {
          const opportunity = await this.sfService.models.accounts.create({
            Name: eventTitle,
            Description: description,
            Start_Date__c: new Date(eventDateTime),
            End_Date__c: new Date(expirationDateTime),
            Phone: phone,
            Website: website,
            Venue__c: venue,
            Category__c: eventType,
            Listed_by__c: userId,
            ParentId: InstituteId,
            Approval_Status__c:
              recordTypeName === RecordTypeName.GUARDIAN
                ? 'AdvisorReview'
                : 'In Review',
            Visibility__c: Visibility.AVAILABLE,
            opportunityScope__c: OpportunityScope.GLOBAL,
            RecordTypeId: recordTypeId[0].RecordTypeId,
            Created_at__c: new Date(),
          });
          if (recordTypeName === RecordTypeName.GUARDIAN) {
            // fetch advisors
            const advisors = await this.sfService.models.affiliations.get(
              'hed__Contact__r.Id',
              {
                hed__Account__c: InstituteId,
                hed__Role__c: 'Advisor',
              },
            );
            const notificationTitle = `Opportunity ${eventTitle}`;
            const notificationMsg = `${eventTitle} opportunity requested for approval`;
            advisors.map(async (adv) => {
              const notificationConfig = {
                userId: adv.hed__Contact__r.Id,
                title: notificationTitle,
                body: notificationMsg,
                notificationId: uuidv4(),
                notificationData: {
                  data: NotificationDataTexts.OPPORTUNITY_REMOVED,
                  type: NotificationDataTypes.OPPORTUNITY_CREATED,
                },
              };
              await this.notifier.send(
                NotificationType.PUSH,
                notificationConfig,
              );
              // create notification
              await this.sfService.models.notifications.create({
                Contact__c: adv.hed__Contact__r.Id,
                Notification_By__c: userId,
                Created_at__c: new Date(),
                Event_type__c: eventType,
                Is_Read__c: false,
                Opportunity__c: opportunity.id,
                Title__c: notificationMsg,
                Type__c: NotificationTitles.OPPORTUNITY_APPROVAL_REQUEST,
              });
            });
          } else {
            // fetch admin
            const admins = await this.sfService.models.affiliations.get(
              'hed__Contact__r.Id',
              {
                hed__Account__c: InstituteId,
                hed__Role__c: 'Admin',
              },
            );
            const notificationTitle = `Opportunity ${eventTitle}`;
            const notificationMsg = `${eventTitle} opportunity requested for approval`;
            admins.map(async (admin) => {
              const notificationConfig = {
                userId: admin.hed__Contact__r.Id,
                title: notificationTitle,
                body: notificationMsg,
                notificationId: uuidv4(),
                notificationData: {
                  data: NotificationDataTexts.OPPORTUNITY_REMOVED,
                  type: NotificationDataTypes.OPPORTUNITY_CREATED,
                },
              };
              await this.notifier.send(
                NotificationType.PUSH,
                notificationConfig,
              );

              // create notification
              await this.sfService.models.notifications.create({
                Contact__c: admin.hed__Contact__r.Id,
                Notification_By__c: userId,
                Created_at__c: new Date(),
                Event_type__c: eventType,
                Is_Read__c: false,
                Opportunity__c: opportunity.id,
                Title__c: notificationMsg,
                Type__c: NotificationTitles.OPPORTUNITY_APPROVAL_REQUEST,
              });
            });
          }
          return {
            statusCode: 201,
            message: NotificationMessage.OPPORTUNITY_CREATED,
          };
        }
      }
    }
    throw new BadRequestException(Errors.FAILED);
  }

  async changeHidingStatus(
    userId: string,
    opportunityIds: string[],
    hidingStatus: string,
  ) {
    if (!(hidingStatus in [Visibility.HIDDEN, Visibility.AVAILABLE])) {
      throw new BadRequestException(Errors.INVALID_HIDING_STATUS);
    }
    const Result = [];
    const listedBy = await this.sfService.models.activities.get({
      Listed_by__c: userId,
    });
    const isPresent = new Map();
    listedBy.map((event) => {
      isPresent.set(event.Id, event);
    });
    opportunityIds.map(async (event) => {
      const temp = [];
      temp.push(event);
      if (isPresent.has(event)) {
        if (isPresent.get(event).Visibility__c === Visibility.REMOVED) {
          temp.push(Errors.EVENT_REMOVED);
        } else {
          if (hidingStatus == Visibility.HIDDEN) {
            if (isPresent.get(event).Visibility__c === Visibility.HIDDEN) {
              temp.push(Errors.ALREADY_HIDDEN_EVENT);
            } else {
              await this.sfService.models.accounts.update(event, {
                Visibility__c: Visibility.HIDDEN,
              });
              temp.push(Responses.EVENT_MADE_HIDDEN);
            }
          } else if (hidingStatus == Visibility.AVAILABLE) {
            if (isPresent.get(event).Visibility__c == Visibility.AVAILABLE) {
              temp.push(Errors.ALREADY_AVAILABLE_EVENT);
            } else {
              await this.sfService.models.accounts.update(event, {
                Visibility__c: Visibility.AVAILABLE,
              });
              temp.push(Responses.EVENT_MADE_AVAILABLE);
            }
          }
        }
      } else {
        temp.push(Errors.INVALID_CREDENTIALS);
      }
      Result.push(temp);
    });

    return { statusCode: 201, message: 'Success', data: Result };
  }

  async getOpportunityById(opportunityId: string) {
    let res;
    try {
      res = await this.sfService.models.accounts.get('*', {
        Id: opportunityId,
      });
      if (res.length === 0) {
        throw new NotFoundException();
      }
      let filteredData;
      if (res[0]['opportunityScope__c'] === 'Discrete') {
        const assignees = await this.sfService.models.opportunities.get(
          'Contact__r.Id, Contact__r.Name, Contact__r.Profile_Picture__c',
          { Account__c: res[0]['Id'] },
        );
        const assigneesList = [];
        assignees.map((ass) => {
          const oppassignee = {
            Id: ass.Contact__r.Id,
            name: ass.Contact__r.Name,
            profilePicture: ass.Contact__r.Profile_Picture__c,
            isAssignee: true,
          };
          assigneesList.push(oppassignee);
        });
        const data = {
          Id: res[0]['Id'],
          eventName: res[0]['Name'],
          description: res[0]['Description'],
          venue: res[0]['Venue__c'],
          website: res[0]['Website'],
          eventDate: res[0]['Start_Date__c'],
          phone: res[0]['Phone'],
          type: res[0]['Type'] || 'Others',
          visibility: res[0]['Visibility__c'],
          expirationDate: res[0]['End_Date__c'],
          status: res[0]['Approval_Status__c'],
          assignees: assigneesList,
        };
        filteredData = data;
      } else if (res[0]['opportunityScope__c'] === 'Global') {
        filteredData = {
          Id: res[0]['Id'],
          eventName: res[0]['Name'],
          description: res[0]['Description'],
          venue: res[0]['Venue__c'],
          website: res[0]['Website'],
          eventDate: res[0]['Start_Date__c'],
          phone: res[0]['Phone'],
          type: res[0]['Type'] || 'Others',
          visibility: res[0]['Visibility__c'],
          expirationDate: res[0]['End_Date__c'],
          status: res[0]['Approval_Status__c'],
          assignees: null,
        };
      }
      return {
        statusCode: 200,
        message: 'OpportunityDetail',
        data: filteredData,
      };
    } catch (err) {
      throw new NotFoundException(Errors.OPPORTUNITY_NOT_FOUND);
    }
  }

  async getOpportunityWithUserId(userId: string) {
    try {
      const res = await this.sfService.models.accounts.get('*', {
        Listed_by__c: userId,
        RecordTypeId: '0124C0000008y1AQAQ',
      });
      const assignedOpportunities = await this.sfService.models.accounts.get(
        '*',
        {
          Event_Assignee__c: userId,
          RecordTypeId: '0124C0000008y1AQAQ',
        },
      );

      const filteredData = [];

      res
        .filter(
          (event) =>
            event.Approval_Status__c == 'Approved' &&
            (event.opportunityScope__c == 'Discrete' ||
              event.opportunityScope__c == 'Global'),
        )
        .map((event) => {
          const filterDataObj = {
            Id: event.Id,
            eventName: event.Name,
            description: event.Description,
            venue: event.Venue__c,
            website: event.Website,
            eventDate: event.Start_Date__c,
            phone: event.phone,
            Type: event.Category__c,
            approvalStatus: event.Approval_Status__c,
            expirationDate: event.End_Date__c,
          };
          filteredData.push(filterDataObj);
        });

      assignedOpportunities
        .filter(
          (event: any) =>
            event.Approval_Status__c == 'Approved' &&
            (event.opportunityScope__c == 'Discrete' ||
              event.opportunityScope__c == 'Global'),
        )
        .map((event) => {
          const filterDataObj = {
            Id: event.Id,
            eventName: event.Name,
            description: event.Description,
            venue: event.Venue__c,
            website: event.Website,
            eventDate: event.Start_Date__c,
            phone: event.phone,
            Type: event.Category__c,
            approvalStatus: event.Approval_Status__c,
            expirationDate: event.End_Date__c,
          };
          filteredData.push(filterDataObj);
        });

      return {
        statusCode: 201,
        data: filteredData,
      };
    } catch (err) {
      throw new NotFoundException(Errors.OPPORTUNITY_NOT_FOUND);
    }
  }

  async getOpportunityRecipients(userId: string, RecordTypeName: string) {
    if (RecordTypeName === 'Student') {
      const me = await this.sfService.generics.contacts.get(
        'Primary_Educational_Institution__c',
        { Id: userId },
      );
      const insId = me[0]['Primary_Educational_Institution__c'];
      const filteredData = [];
      const guardians = await this.sfService.models.relationships.get(
        'hed__RelatedContact__r.id, hed__RelatedContact__r.Name, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Primary_Educational_Institution__c',
        {
          hed__Contact__c: userId,
          hed__Type__c: 'Guardian',
        },
      );
      guardians.map((event) => {
        const filterDataObj = {
          Id: event.hed__RelatedContact__r.Id,
          name: event.hed__RelatedContact__r.Name,
          profilePicture: event.hed__RelatedContact__r.Profile_Picture__c,
          institute:
            event.hed__RelatedContact__r.Primary_Educational_Institution__c,
        };
        if (
          (event.dev_uuid__c && process.env.NODE_ENV !== 'prod') ||
          (event.prod_uuid__c && process.env.NODE_ENV === 'prod')
        ) {
          filteredData.push(filterDataObj);
        }
      });
      const advisors = await this.sfService.models.relationships.get(
        'hed__RelatedContact__r.id, hed__RelatedContact__r.Name, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Primary_Educational_Institution__c',
        {
          hed__Contact__c: userId,
          hed__Type__c: 'Mentor',
        },
      );
      advisors.map((event) => {
        const filterDataObj = {
          Id: event.hed__RelatedContact__r.Id,
          name: event.hed__RelatedContact__r.Name,
          profilePicture: event.hed__RelatedContact__r.Profile_Picture__c,
          institute:
            event.hed__RelatedContact__r.Primary_Educational_Institution__c,
        };
        if (
          (event.dev_uuid__c && process.env.NODE_ENV !== 'prod') ||
          (event.prod_uuid__c && process.env.NODE_ENV === 'prod')
        ) {
          filteredData.push(filterDataObj);
        }
      });
      const admins = await this.sfService.models.affiliations.get(
        'Id, hed__Contact__r.Name, hed__Contact__r.Profile_Picture__c, hed__Contact__r.Primary_Educational_Institution__c',
        {
          hed__Account__c: insId,
          hed__Role__c: 'Admin',
        },
      );
      admins.map((event) => {
        const filterDataObj = {
          Id: event.Id,
          name: event.hed__Contact__r.Name,
          profilePicture: event.hed__Contact__r.Profile_Picture__c,
          institute: event.hed__Contact__r.Primary_Educational_Institution__c,
        };
        if (
          (event.dev_uuid__c && process.env.NODE_ENV !== 'prod') ||
          (event.prod_uuid__c && process.env.NODE_ENV === 'prod')
        ) {
          filteredData.push(filterDataObj);
        }
      });
      return {
        statusCode: 200,
        message: 'Recipients',
        // TODO confirm why this is hardcoded
        InstituteID: '0014x00000D76KHAAZ',
        data: filteredData,
      };
    } else if (
      RecordTypeName === 'Advisor' ||
      RecordTypeName === 'Faculty/Staff'
    ) {
      const advisor = await this.getAdvisorDetailsStudents(userId);

      const advisorStudents = advisor.data.students;
      const advisorStudentIds = advisorStudents.map((student) => {
        return student.Id;
      });

      const advisorStudentDetails = await this.sfService.generics.contacts.get(
        '*',
        {
          Id: [...advisorStudentIds],
        },
      );

      const advisorContactsList = [];
      for (let i = 0; i < advisorStudents.length; i++) {
        if (process.env.NODE_ENV === 'prod') {
          const obj = {
            id: advisorStudentDetails[i].Id,
            name: advisorStudentDetails[i].Name,
            institute:
              advisorStudentDetails[i].Primary_Educational_Institution__c,
            isRegistered: advisorStudentDetails[i].IsRegisteredOnPalette__c,
            profilePicture: advisorStudentDetails[i].Profile_Picture__c,
            relationship: 'Student',
            firebase_uuid: advisorStudentDetails[i].dev_uuid__c,
          };
          advisorContactsList.push(obj);
        } else {
          const obj = {
            id: advisorStudentDetails[i].Id,
            name: advisorStudentDetails[i].Name,
            institute:
              advisorStudentDetails[i].Primary_Educational_Institution__c,
            isRegistered: advisorStudentDetails[i].IsRegisteredOnPalette__c,
            profilePicture: advisorStudentDetails[i].Profile_Picture__c,
            relationship: 'Student',
            firebase_uuid: advisorStudentDetails[i].dev_uuid__c,
          };
          advisorContactsList.push(obj);
        }
      }

      const guardians = await this.sfService.models.relationships.get(
        'hed__RelatedContact__r.id, hed__RelatedContact__r.Name, hed__RelatedContact__r.Profile_Picture__c',
        {
          hed__Contact__c: advisorStudentIds,
          hed__Type__c: [
            'Father',
            'Stepfather',
            'Mother',
            'Stepmother',
            'Parent',
            'stepparent',
            'Foster Parent',
            'Guardian',
          ],
        },
      );

      const advisorGuardianIds = guardians.map((guardian) => {
        return guardian.hed__RelatedContact__r.Id;
      });

      const advisorParentDetails = await this.sfService.generics.contacts.get(
        'Name, Id, Profile_Picture__c',
        {
          Id: [...advisorGuardianIds],
        },
      );

      for (let i = 0; i < guardians.length; i++) {
        if (process.env.NODE_ENV === 'prod') {
          const obj = {
            id: advisorParentDetails[i].Id,
            name: advisorParentDetails[i].Name,
            institute:
              advisorParentDetails[i].Primary_Educational_Institution__c,
            isRegistered: advisorParentDetails[i].IsRegisteredOnPalette__c,
            profilePicture: advisorParentDetails[i].Profile_Picture__c,
            relationship: 'Guardian',
            firebase_uuid: advisorParentDetails[i].dev_uuid__c,
          };
          advisorContactsList.push(obj);
        } else {
          const obj = {
            id: advisorParentDetails[i].Id,
            name: advisorParentDetails[i].Name,
            institute:
              advisorParentDetails[i].Primary_Educational_Institution__c,
            isRegistered: advisorParentDetails[i].IsRegisteredOnPalette__c,
            profilePicture: advisorParentDetails[i].Profile_Picture__c,
            relationship: 'Guardian',
            firebase_uuid: advisorParentDetails[i].dev_uuid__c,
          };
          advisorContactsList.push(obj);
        }
      }

      const advisorInsti = await this.sfService.models.affiliations.get('*', {
        hed__Account__c: advisor.data.mentor.instituteId,
        hed__Role__c: ['Admin', 'Advisor', 'Observer'],
      });

      for (let i = 0; i < advisorInsti.length; i++) {
        const temp = await this.sfService.models.contacts.get('*', {
          Id: advisorInsti[i].hed__Contact__c,
        });
        if (process.env.NODE_ENV === 'prod') {
          const obj = {
            id: temp[0].Id,
            name: temp[0].Name,
            institute: temp[0].Primary_Educational_Institution__c,
            isRegistered: temp[i].IsRegisteredOnPalette__c,
            profilePicture: temp[i].Profile_Picture__c,
            relationship: advisorInsti[i].hed__Role__c,
            firebase_uuid: temp[i].prod_uuid__c,
          };
          advisorContactsList.push(obj);
        } else {
          const obj = {
            id: temp[0].Id,
            name: temp[0].Name,
            institute: temp[0].Primary_Educational_Institution__c,
            isRegistered: temp[i].IsRegisteredOnPalette__c,
            profilePicture: temp[i].Profile_Picture__c,
            relationship: advisorInsti[i].hed__Role__c,
            firebase_uuid: temp[i].prod_uuid__c,
          };
          advisorContactsList.push(obj);
        }
      }

      return {
        statusCode: 200,
        message: 'Recipients',
        // TODO confirm why this is hardcoded
        InstituteID: '0014x00000D76KHAAZ',
        data: advisorContactsList,
      };
    } else if (RecordTypeName === 'Guardian') {
      const pupils = (await this.getParent(userId)).pupils;
      const pupilList = [];
      for (const pupil of pupils) {
        const pupilProfile = await this.getStudent(pupil.Id);
        pupilList.push({
          Id: pupilProfile.Id,
          name: pupilProfile.name,
          grade: pupilProfile.education[0].course,
          profilePicture: pupilProfile.profilePicture,
          institute: pupilProfile.education[0].instituteId,
        });
      }
      // To get the list of advisors, instituteId is required
      const instituteId = pupilList[0].institute;
      const advisors = await this.sfService.models.affiliations.get('*', {
        hed__Account__c: instituteId,
        hed__Role__c: 'Advisor',
      });
      const advisorList = [];
      for (const advisor of advisors) {
        const advisorProfile = await this.getAdvisor(advisor.hed__Contact__c);
        advisorList.push({
          Id: advisorProfile.Id,
          name: advisorProfile.name,
          profilePicture: advisorProfile.profilePicture,
          institute: advisorProfile.institute_name,
        });
      }
      return {
        statusCode: 200,
        message: 'Recipients',
        // TODO confirm why this is hardcoded
        InstituteID: '0014x00000D76KHAAZ',
        data: [...pupilList, ...advisorList],
      };
    } else if (RecordTypeName === 'Administrator') {
      const adminStudents = await this.getAdminInstituteDetails(userId);

      const adminStudentsList = adminStudents.data.students;
      const adminMentors = adminStudents.data.mentors;
      const adminParents = adminStudents.data.parents;
      const adminAdmins = adminStudents.data.admins;

      const finalList = [
        ...adminStudentsList,
        ...adminMentors,
        ...adminParents,
        ...adminAdmins,
      ];
      return {
        statusCode: 200,
        message: Responses.RECEPIENT,
        // TODO confirm why this is hardcoded
        InstituteID: '0014x00000D76KHAAZ',
        data: finalList,
      };
    }
  }
  async getAdminInstituteDetails(userId: string) {
    const studentIds = [];
    const filteredAdmins = [];

    // getting the institute of the admin
    const institute = await this.sfService.models.affiliations.get(
      'Id, Name,  hed__Account__c, hed__Account__r.Name',
      {
        hed__Contact__c: userId,
        hed__Role__c: 'Admin',
      },
    );

    if (institute.length === 0) {
      throw new BadRequestException(Errors.NO_INSTITUTES_ASSIGNED_TO_ADMIN);
    }

    // getting all the admin inside the institute
    const Admins = await this.sfService.models.affiliations.get(
      'hed__Contact__c, hed__Contact__r.Name, hed__Role__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Admin',
      },
    );

    Admins.filter(
      (admin) =>
        // checking this to exclude the user that are deactivated
        // and also excluding the user requesting
        admin.hed__Contact__c !== userId &&
        admin.hed__Contact__r.Is_Deactive__c === false,
    ).map((admin) => {
      const adminObj = {
        Id: admin.hed__Contact__c,
        name: admin.hed__Contact__r.Name,
        profilePicture: admin.hed__Contact__r.Profile_Picture__c || null,
        isRegistered: admin.hed__Contact__r.IsRegisteredOnPalette__c,
      };
      filteredAdmins.push(adminObj);
    });

    // getting all the students inside the institute
    const students = await this.sfService.generics.contacts.get(
      'Id, Name, Grade__c, Primary_Educational_Institution__r.Name, Profile_Picture__c, Is_Deactive__c',
      {
        Primary_Educational_Institution__c: institute[0].hed__Account__c,
      },
    );

    // getting all the mentors inside the institute
    const mentors = await this.sfService.models.affiliations.get(
      'Id, Name,  hed__Account__c, hed__Affiliation_Type__c, hed__Contact__c, hed__Description__c, hed__Role__c, hed__Contact__r.Id, hed__Contact__r.Name, hed__Contact__r.Designation__c, hed__Contact__r.Profile_Picture__c, hed__Contact__r.IsRegisteredOnPalette__c, hed__Contact__r.Palette_Email__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__Account__c: institute[0].hed__Account__c,
        hed__Role__c: 'Advisor',
      },
    );

    // filtering the data
    const filteredStudents = [];
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

    const filteredMentor = [];
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
    const studentConnection = await this.sfService.models.relationships.get(
      'hed__Contact__r.Primary_Educational_Institution__c, hed__RelatedContact__c, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.Name, hed__RelatedContact__r.Palette_Email__c, hed__Type__c, hed__RelatedContact__r.Is_Deactive__c',
      {
        hed__Contact__c: studentIds,
        hed__Type__c: GuardianObserverSubRoles,
      },
    );

    const filteredParent = [];
    const filteredObserver = [];

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
    const uniqueParents = filteredParent.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    const uniqueObserver = filteredObserver.filter(
      (v, i, a) =>
        a.findIndex((t) => JSON.stringify(t) === JSON.stringify(v)) === i,
    );

    const response = {
      statusCode: 200,
      data: {
        students: filteredStudents,
        mentors: filteredMentor,
        parents: uniqueParents,
        observers: uniqueObserver,
        admins: filteredAdmins,
      },
    };
    return response;
  }
  async getAdvisor(id: string) {
    const responseData = await this.sfService.generics.contacts.get(
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
      throw new NotFoundException(`Advisor with ID "${id}" not found`);
    }

    const institute = await this.sfService.models.accounts.get('Id, Name', {
      Id: AccountId,
    });

    const instituteName: string | null =
      institute === null ? null : institute.map((c) => c.Name).toString();

    const advisorData = {
      Id: Id,
      name: Name,
      phone: Phone,
      email: Palette_Email__c,
      profilePicture: Profile_Picture__c,
      instituteId: institute[0].Id,
      institute_name: instituteName,
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

    return advisorData;
  }
  async getStudent(id: string) {
    const responseData = await this.sfService.generics.contacts.get(
      'Id, Name, Birthdate, hed__Gender__c, Grade__c, k12kit__Student_ID__c, Phone, Palette_Email__c, Interests__c, skills__c, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook__c, Whatsapp__c, Instagram__c, Website__c, WebsiteTitle__c, Github__c, LinkedIn_URL__c, Primary_Educational_Institution__c, Profile_Picture__c',
      {
        Id: id,
      },
    );
    const {
      Id,
      Name,
      Birthdate,
      hed__Gender__c,
      Grade__c,
      k12kit__Student_ID__c,
      Phone,
      Palette_Email__c,
      Interests__c,
      skills__c,
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
      Primary_Educational_Institution__c,
      Profile_Picture__c,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`student with ID "${id}" not found`);
    }

    const institute =
      Primary_Educational_Institution__c === null
        ? null
        : await this.sfService.models.accounts.get('Id, Name', {
            Id: Primary_Educational_Institution__c,
          });

    const instituteName: string | null =
      institute === null ? null : institute.map((c) => c.Name).toString();

    const workExp = await this.sfService.models.affiliations.get(
      'Id, Name, hed__Account__c, hed__Affiliation_Type__c, hed__Contact__c, hed__EndDate__c, hed__StartDate__c, hed__Role__c, Tenure__c,  hed__Description__c, Job_Type__c, Designation__c',
      {
        hed__Contact__c: Id,
        hed__Affiliation_Type__c: 'Business Organization',
      },
    );
    const studentWorkExperience = await this.studentWorkExpMapping(workExp);

    const studentInterests: string[] =
      Interests__c === null ? null : Interests__c.split(',');
    const studentSkills: string[] =
      skills__c === null ? null : skills__c.split(',');

    const studentData = {
      Id: Id,
      name: Name,
      DOB: Birthdate,
      gender: hed__Gender__c,
      education: [
        {
          instituteId: institute[0].Id,
          institute_name: instituteName,
          course: Grade__c,
          roll_no: k12kit__Student_ID__c,
        },
      ],
      phone: Phone,
      email: Palette_Email__c,
      profilePicture: Profile_Picture__c,
      work_experience: studentWorkExperience,
      interests: studentInterests,
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
      skills: studentSkills,
      projects: [],
      activities: [],
    };

    return studentData;
  }
  async studentWorkExpMapping(workExp: any) {
    return await Promise.all(
      workExp.map(async (c) => {
        const orgName = await this.sfService.models.accounts.get('Name', {
          Id: c.hed__Account__c,
        });
        const workObj = {
          organizationName: orgName[0].Name,
          role: c.hed__Role__c,
          startDate: c.hed__StartDate__c,
          endDate: c.hed__EndDate__c,
        };
        return workObj;
      }),
    );
  }

  async getParent(id: string) {
    const responseData = await this.sfService.generics.contacts.get(
      'Id, Name, Phone, Palette_Email__c, MailingCity, MailingCountry, MailingState, MailingStreet, MailingPostalCode, Facebook__c, Whatsapp__c, Instagram__c, Website__c, WebsiteTitle__c, Github__c, LinkedIn_URL__c, Profile_Picture__c',
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
      Profile_Picture__c,
    } = responseData[0];

    if (!responseData) {
      throw new NotFoundException(`parent with ID "${id}" not found`);
    }

    const studentList = await this.sfService.models.relationships.get(
      'Id, Name, hed__Contact__c, hed__Type__c, hed__Relationship_Explanation__c, hed__RelatedContact__c, hed__Description__c, hed__Contact__r.Name, hed__Contact__r.Profile_Picture__c, hed__Contact__r.Is_Deactive__c',
      {
        hed__RelatedContact__c: Id,
        hed__Type__c: GuardianSubRoles,
      },
    );

    const students: Array<{
      Id: string;
      Name: string;
      profilePicture: string;
    }> = [];

    studentList.map((student) => {
      if (student.hed__Contact__r.Is_Deactive__c === false) {
        const filterObj = {
          Id: student.hed__Contact__c,
          Name: student.hed__Contact__r.Name,
          profilePicture: student.hed__Contact__r.Profile_Picture__c,
        };
        students.push(filterObj);
      }
    });

    const parentData = {
      Id: Id,
      name: Name,
      phone: Phone,
      email: Palette_Email__c,
      profilePicture: Profile_Picture__c,
      pupils: students,
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

    return parentData;
  }
  async getAdvisorDetailsStudents(mentorId: string) {
    const filteredStudents = await this.getFilteredStudents(mentorId);

    const advisor = await this.getAdvisor(mentorId);
    return {
      statusCode: 200,
      data: { mentor: advisor, students: filteredStudents },
    };
  }
  async getFilteredStudents(mentorId: string) {
    const students = await this.sfService.models.relationships.get(
      'Id, Name, hed__Contact__c, hed__Contact__r.Name, hed__Contact__r.Grade__c, hed__RelatedContact__r.Id, hed__RelatedContact__r.Name, hed__Type__c, hed__RelatedContact__r.Primary_Educational_Institution__c, hed__RelatedContact__r.Profile_Picture__c, hed__RelatedContact__r.IsRegisteredOnPalette__c, hed__RelatedContact__r.Is_Deactive__c',
      {
        hed__Contact__c: mentorId,
        hed__Type__c: MentorSubRoles, // Mentor ==> Advisor
      },
    );

    if (students.length === 0) {
      throw new NotFoundException(Errors.NO_STUDENT);
    }

    // filtering data
    const filteredStudents = [];
    students.map((c) => {
      if (c.hed__RelatedContact__r.Is_Deactive__c === false) {
        const filteredObj = {
          Id: c.hed__RelatedContact__r.Id,
          name: c.hed__RelatedContact__r.Name,
          grade: c.hed__RelatedContact__r.Grade__c || null,
          profilePicture: c.hed__RelatedContact__r.Profile_Picture__c || null,
          institute:
            c.hed__RelatedContact__r.Primary_Educational_Institution__c || null,
          isRegistered: c.hed__RelatedContact__r.IsRegisteredOnPalette__c,
        };
        filteredStudents.push(filteredObj);
      }
    });

    return filteredStudents;
  }
}
