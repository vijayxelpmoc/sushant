import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ActivityEvents, Errors, Responses } from '@src/constants';
// import { SfService } from '@gowebknot/palette-wrapper';

import { SfService } from '@gowebknot/palette-salesforce-service';
import {
  AcceptRecommendationDto,
  EventTodoDto,
  DeclineRecommendationDto,
  RecommendEventDto,
} from './dtos';
import {
  RecommendationsData,
  SFEventEnrollment,
  SFEventResource,
  SFRecommendations,
  SFActivityActivityDetail,
  SFRecommendationId,
} from './types';

@Injectable()
export class EventsService {
  constructor(private sfService: SfService) {}

  /**
   * this will get all the recommendations for a students
   * @param userId - id of the user
   * returns all the recommendation for a student
   */
  async getRecommendedEvents(userId: string) {
    const recommendedEvents: SFRecommendations[] =
      await this.sfService.models.recommendations.get(
        'Id, Name, Assignee__c, Recommended_by__c, Recommended_by__r.Name, Recommended_by__r.Record_Type_Name__c, Event__c, Event__r.Name, Event__r.Description, Event__r.Start_Date__c, Event__r.End_Date__c, Event__r.Category__c, Event__r.Venue__c, Event__r.Phone, Event__r.Website, Accepted__c',
        { Assignee__c: userId, Accepted__c: 'Pending' },
      );
    if (recommendedEvents.length === 0) {
      throw new NotFoundException(Errors.NO_EVENT);
    }
    const responseRecommendedRecords: RecommendationsData[] = [];
    const recommendationRecords = {};

    recommendedEvents.forEach((recommendEvent) => {
      const responseObj = {
        Id: recommendEvent.Id,
        recommendedBy: {
          Id: recommendEvent.Recommended_by__c,
          Name: recommendEvent.Recommended_by__r.Name,
          Role: recommendEvent.Recommended_by__r.Record_Type_Name__c,
        },
        event: {
          Id: recommendEvent.Event__c,
          Name: recommendEvent.Event__r.Name,
          Description: recommendEvent.Event__r.Description,
          Category:
            recommendEvent.Event__r.Category__c === 'Event - Social'
              ? 'Event - Social'
              : recommendEvent.Event__r.Category__c === null
              ? 'Other'
              : recommendEvent.Event__r.Category__c,
          StartDate: recommendEvent.Event__r.Start_Date__c,
          EndDate: recommendEvent.Event__r.End_Date__c,
          Venue: recommendEvent.Event__r.Venue__c,
          Phone: recommendEvent.Event__r.Phone,
          Website: recommendEvent.Event__r.Website,
        },
      };

      if (!recommendationRecords[responseObj.event.Id]) {
        recommendationRecords[responseObj.event.Id] = [];
      }

      recommendationRecords[responseObj.event.Id].push(responseObj);
    });

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
    return {
      statusCode: 200,
      message: Responses.EVENT_RECOMMEND_DATA,
      data: responseRecommendedRecords,
    };
  }

  /**
   * This service is used by parent and advisor to create recommendation of an event
   * @param userId - id of the user
   * @param RecommendEventDto - dto consist eventId - event which is to be recommended,
   * assigneesId - all the id of assignees the event is to be recommended
   * returns status and error code
   */
  async recommendEvent(userId: string, recommendEventDto: RecommendEventDto) {
    const { eventId, assigneeIds } = recommendEventDto;

    for (const assignee of assigneeIds) {
      await this.sfService.models.recommendations.create({
        Assignee__c: assignee,
        Recommended_by__c: userId,
        Event__c: eventId,
        Accepted__c: 'Pending',
      });
    }

    return {
      statusCode: 200,
      message: Responses.EVENT_RECOMMEND,
    };
  }

  /**
   * This service is used by students to accept the recommendation
   * @param userId Id of user
   * @param acceptRecommendationDto contains the eventId
   * returns status and error code
   */
  async acceptRecommendation(
    userId: string,
    acceptRecommendationDto: AcceptRecommendationDto,
  ) {
    const { eventId } = acceptRecommendationDto;
    try {
      await this.createTodoWithEvent(userId, {
        eventId,
        listedBy: null,
      });
    } catch (err) {
      if (err.message === Errors.USER_EXIST) {
        await this.markRecommendationAccepted(eventId, userId);
      }
      throw err;
    }

    const success = await this.markRecommendationAccepted(eventId, userId);

    if (!success) {
      throw new InternalServerErrorException(Errors.EVENT_ACCEPT);
    }

    return {
      statusCode: 200,
      message: Responses.EVENT_ACCEPT,
    };
  }
  /**
   * Marks Recommendation as Accepted
   * @param eventId Id of the event to accept
   * @param userId userId for whom the recommendation must be accepted
   */
  async markRecommendationAccepted(eventId: string, userId: string) {
    const recommendationRecs: SFRecommendationId[] =
      await this.sfService.models.recommendations.get('Id', {
        Assignee__c: userId,
        Event__c: eventId,
        Accepted__c: 'Pending',
      });

    const recUpdateData = recommendationRecs.map((record) => ({
      Id: record.Id,
      Accepted__c: 'Accepted',
    }));

    const response = await this.sfService.models.recommendations.update(
      recUpdateData,
    );

    return response.every((res) => res.success);
  }
  /**
   * create todo from a event for a parent
   * @param userId user id whom the todo must be created
   * @param EventTodoDto id of the event and who listed the the event
   * statusCode and errors.
   */
  async createTodoWithEvent(userId: string, eventTodoDto: EventTodoDto) {
    const { eventId, listedBy } = eventTodoDto;
    // checking if the user is already enrolled in the event
    const getEventInstance: SFEventEnrollment[] =
      await this.sfService.models.activities.get('Contact__c, Event__c', {
        Contact__c: userId,
        Event__c: eventId,
      });
    if (getEventInstance.length >= 1) {
      throw new BadRequestException(Errors.USER_EXIST);
    }
    // if the user isnt enrolled then we will create a instance of paletteActivity to enroll him in the event
    await this.sfService.models.activities.create({
      Contact__c: userId,
      Event__c: eventId,
    });

    // getting all the event details by id
    const activityDetails: SFActivityActivityDetail[] =
      await this.sfService.models.activities.get(
        'Id, Name, Description, Start_Date__c, End_Date__c, Category__c, Venue__c , ShippingAddress, Phone, Website, CreatedById, Listed_by__c, Record_Type_Name__c',
        {
          Id: eventId,
          Record_Type_Name__c: ['Activity', 'Activities'], // Activities
        },
      );

    // getting the resources id for the event to update the task id ahead.
    const EventId = [eventId];
    const eventResourceIds: string[] = await this.getResourcesByActivityId(
      EventId,
      true,
    );

    // setting the todo type as per the event type
    let activityType = '';
    if (activityDetails[0].Category__c in Object.values(ActivityEvents)) {
      activityType = activityDetails[0].Category__c;
    } else {
      activityType = 'Other';
    }

    const eventToDoDetails = {
      Assignee__c: userId,
      Group_Id__c: activityDetails[0].Id,
      Name: activityDetails[0].Name,
      Description__c: activityDetails[0].Description,
      Task_status__c: 'Open',
      Type__c: activityType ? activityType : 'Other',
      Event_At__c: activityDetails[0].End_Date__c,
      Event_Venue__c: activityDetails[0].Venue__c,
      Complete_By__c: activityDetails[0].End_Date__c,
      Listed_by__c: listedBy || activityDetails[0].Listed_by__c,
    };

    // creating the todo
    const createTodoResponse = await this.sfService.models.todos.create(
      eventToDoDetails,
    );

    // updating the resource with the todo id to connect the todo with the resources
    if (eventResourceIds.length >= 1) {
      for (const connection of eventResourceIds) {
        await this.sfService.models.resourceConnections.update(connection, {
          Todo__c: createTodoResponse.id,
        });
      }
    }

    return { statusCode: 200, message: Responses.TODO_CREATED };
  }

  /**
   * Return All the resources for the events by id
   * @param activitiesIds array of activities id
   */
  async getResourcesByActivityId(
    activitiesIds: string[],
    resourceIds?: boolean,
  ): Promise<any> {
    const resources: SFEventResource[] =
      await this.sfService.models.resourceConnections.get(
        'Id, Name, Event__c, Resource__c, Resource__r.Name, Resource__r.URL__c, Resource__r.Resource_Type__c',
        {
          Event__c: activitiesIds,
        },
      );
    // after getting the resources by id adding them into the hashmap to access the resources by task id faster rather than doing two for loops
    const allResource = {};
    const resourceConnectionsId = [];
    resources.map((resource) => {
      const resourcesObj = {
        name: resource.Resource__r.Name,
        url: resource.Resource__r.URL__c,
        type: resource.Resource__r.Resource_Type__c,
      };
      // if a record with a todo task is present then add the object into it or if not create one
      const hashResource = allResource[`${resource.Event__c}`];
      if (hashResource) {
        hashResource.push(resourcesObj);
        allResource[`${resource.Event__c}`] = hashResource;
      } else {
        const Allresources: any = [];
        Allresources.push(resourcesObj);
        allResource[`${resource.Event__c}`] = Allresources;
      }
      resourceConnectionsId.push(resource.Id);
    });
    return resourceIds ? resourceConnectionsId : allResource;
  }

  /**
   * This service is used by parent to decline the recommendation and that will be deleted
   * @param recommendationId - id of the recommended record
   * returns status and error code
   */
  async declineRecommendation(
    declineRecommendationDto: DeclineRecommendationDto,
  ) {
    const recommendationId = declineRecommendationDto.recommendationId;
    const updateData = recommendationId.map((Id) => ({
      Id,
      Accepted__c: 'Declined',
    }));

    const updateResponse = await this.sfService.models.recommendations.update(
      updateData,
    );

    if (updateResponse.every((res) => res.success)) {
      return {
        statusCode: 200,
        message: Responses.EVENT_DECLINE,
      };
    }
  }
}
