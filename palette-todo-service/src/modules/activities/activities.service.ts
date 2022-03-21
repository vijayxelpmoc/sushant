import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Date } from 'jsforce';

import { SfService } from '@gowebknot/palette-wrapper';
import {
  ActivitiesResponse,
  Activity,
  ActivityDetail,
  ActivityDetailResponse,
  ActivityInstitute,
  AllActivityResponse,
  AllActivityResponseData,
  Participant,
  ResponseInstituteEvents,
  SFActivityAccountDetail,
  SFActivityAccountParticipant,
  SFContactDetailInstitute,
  SFPaletteActivityIsOptIn,
  SFPaletteActivityOrganization,
  SFRecommendations,
} from './types/activity-interface';
import {
  getActivityFilteredObject,
  getMappedActivityObject,
} from './utils/activities.utils';
import { SFEventResource } from '../todo/types/salesforce-interface';

@Injectable()
export class ActivitiesService {
  constructor(private sfService: SfService) {}

  /**
   * Return All the {Volunteering, Arts and Sports, Social Events} Activities of the Student
   * @param studentId Id of the Student
   */
  async getStudentActivities(studentId: string): Promise<ActivitiesResponse> {
    const paletteActivitiesDetail: SFPaletteActivityOrganization[] =
      await this.sfService.models.activities.get(
        'Event__r.Id, Event__r.Name, Event__r.Venue__c, Event__r.Description, Event__r.Category__c, Event__r.Start_Date__c, Event__r.End_Date__c, Event__r.ShippingAddress, Event__r.Phone, Event__r.Website',
        {
          Contact__c: studentId,
          HasOptOut__c: false,
          'Event__r.Start_Date__c': { $lt: Date.TODAY },
        },
      );

    const studentActivities: Activity[] = paletteActivitiesDetail.map((value) =>
      getMappedActivityObject(value.Event__r),
    );

    return {
      statusCode: 200,
      data: {
        ...getActivityFilteredObject(studentActivities),
      },
    };
  }

  /**
   * Return All the resources true for the events which the student is already enrolled
   * @param activitiesIds array of activities id
   */
  async getEnrolledInActivities(activitiesIds: string[], userId: string) {
    const paletteActivities = await this.sfService.models.activities.get(
      'Event__c',
      {
        Contact__c: userId,
        Event__c: activitiesIds,
      },
    );
    const paletteActivitiesResponse = [];
    paletteActivities.map((activityId) => {
      paletteActivitiesResponse[activityId.Event__c] = true;
    });
    return paletteActivitiesResponse;
  }

  async getRecommendedActivities(activitiesIds: string[], userId: string) {
    const recommendedActivities: SFRecommendations[] =
      await this.sfService.models.recommendations.get(
        'Id, Name, Assignee__c, Recommended_by__c, Recommended_by__r.Name, Recommended_by__r.Record_Type_Name__c, Event__c, Event__r.Name, Event__r.Description, Event__r.Start_Date__c, Event__r.End_Date__c, Event__r.Category__c, Event__r.Venue__c, Accepted__c',
        {
          Assignee__c: userId,
          Event__c: activitiesIds,
          Accepted__c: 'Pending',
        },
      );

    const recommendedActivitiesResponse = {};
    recommendedActivities.map((activityId) => {
      // recommendedActivitiesResponse[activityId.Event__c] = false;
      if (activityId.Recommended_by__c !== userId) {
        recommendedActivitiesResponse[activityId.Event__c] = true;
      }
    });
    return recommendedActivitiesResponse;
  }

  /**
   * Return All the resources true for the events which are wish Listed
   * @param activitiesIds array of activities id
   */
  async getWishListedActivities(activitiesIds: string[], userId: string) {
    const wishListedActivities: SFRecommendations[] =
      await this.sfService.models.recommendations.get(
        'Id, Name, Assignee__c, Recommended_by__c, Recommended_by__r.Name, Recommended_by__r.Record_Type_Name__c, Event__c, Event__r.Name, Event__r.Description, Event__r.Start_Date__c, Event__r.End_Date__c, Event__r.Category__c, Event__r.Venue__c, Accepted__c',
        {
          Assignee__c: userId,
          Event__c: activitiesIds,
          Accepted__c: 'Pending',
          Recommended_by__c: userId,
        },
      );

    const wishListedActivitiesResponse = {};
    wishListedActivities.map((activityId) => {
      wishListedActivitiesResponse[activityId.Event__c] = true;
    });
    return wishListedActivitiesResponse;
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
        const allResources = [];
        allResources.push(resourcesObj);
        allResource[`${resource.Event__c}`] = allResources;
      }
      resourceConnectionsId.push(resource.Id);
    });
    if (resourceIds === true) {
      return resourceConnectionsId;
    }
    return allResource;
  }

  async getInstituteActivities(
    instituteId?: string,
    studentId?: string,
  ): Promise<ResponseInstituteEvents> {
    // Getting all the Account(RecordTypeName-Activity) with ParentId === instituteId
    const queryFilter = {
      Record_Type_Name__c: ['Activity', 'Activities'],
      Removal_Status__c: [null, 'In Review', 'Not Approved'],
    };

    const allAccountsDetail = await this.sfService.models.accounts.get(
      'Id, Name, ParentId, Description, Start_Date__c, End_Date__c, Category__c, Venue__c , ShippingAddress, Phone, Website, Listed_by__c, Record_Type_Name__c,Status__c,opportunityScope__c, Removal_Status__c',
      queryFilter,
    );

    const accountsDetail = [];
    allAccountsDetail.map((event) => {
      if (
        event.opportunityScope__c == 'Discrete' ||
        event.Status__c == 'Approved'
      ) {
        accountsDetail.push(event);
      }
    });
    const instituteIds = [];
    if (instituteId) {
      instituteIds.push(instituteId);
    } else {
      for (const account of accountsDetail) {
        instituteIds.push(account.ParentId);
      }
    }

    const parentAccounts = await this.sfService.models.accounts.get(
      'Id, Name',
      {
        Id: instituteIds,
      },
    );

    const parentAccount: any = {};

    parentAccounts.map((acc) => {
      parentAccount[acc.Id] = acc.Name;
    });

    if (accountsDetail.length === 0) {
      return {
        statusCode: 200,
        data: [],
      };
    }

    // storing activities id to get their resources
    const activitiesIds = [];
    const instituteActivities: ActivityInstitute[] = [];

    // filtering activities
    accountsDetail.map((value) => {
      const filterObj = getMappedActivityObject(value);
      instituteActivities.push({
        ...filterObj,
        institute: {
          Id: value.ParentId,
          name: parentAccount[value.ParentId],
        },
      });
      activitiesIds.push(value.Id);
    });

    // getting resources by activities id
    const resourcesData = await this.getResourcesByActivityId(activitiesIds);
    // adding the activity and the resources together
    const responseActivities: AllActivityResponseData[] = [];

    let wishListedActivities = {};
    let recommendedActivities = {};
    let getEnrolledInActivities = {};
    if (studentId) {
      wishListedActivities = await this.getWishListedActivities(
        activitiesIds,
        studentId,
      );
      recommendedActivities = await this.getRecommendedActivities(
        activitiesIds,
        studentId,
      );
      getEnrolledInActivities = await this.getEnrolledInActivities(
        activitiesIds,
        studentId,
      );
    }

    // adding them into task and structuring the response
    instituteActivities.map((activity) => {
      // when a student is accessing the events then send wishListed Boolean and also enrolled to see if the student is already enrolled in that event
      if (studentId) {
        const wishListedEvent = wishListedActivities[`${activity.activity_id}`];
        const recommendedEvent =
          recommendedActivities[`${activity.activity_id}`];
        const getEnrolledInEvent =
          getEnrolledInActivities[`${activity.activity_id}`];
        const filteredToDoObj = {
          activity: activity,
          wishListedEvent: wishListedEvent || false,
          recommendedEvent: recommendedEvent || true,
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
   * Return All the {Volunteering, Arts and Sports, Social Events} Activities of the Student's Institute
   * @param studentId
   */
  async getStudentInstituteActivities(
    studentId: string,
  ): Promise<AllActivityResponse> {
    const contactDetail: SFContactDetailInstitute[] =
      await this.sfService.generics.contacts.get(
        'Id, Primary_Educational_Institution__c',
        {
          Id: studentId,
        },
      );
    if (
      contactDetail.length === 0 ||
      !contactDetail[0].Primary_Educational_Institution__c
    ) {
      throw new BadRequestException();
    }

    const instituteId = contactDetail[0].Primary_Educational_Institution__c;
    const responseActivities = await this.getInstituteActivities(
      instituteId,
      studentId,
    );

    return {
      statusCode: 200,
      data: responseActivities.data,
    };
  }

  /**
   * Return Activity Detail
   * @param activityId
   * @param studentId
   */
  async getActivityDetailUsingId(
    studentId,
    activityId,
  ): Promise<ActivityDetailResponse> {
    const accountsDetail: SFActivityAccountDetail[] =
      await this.sfService.models.accounts.get(
        'Id, Name, Description, Start_Date__c, End_Date__c, ShippingAddress, Phone, Category__c, Venue__c, Website',
        {
          Id: activityId,
        },
      );

    if (accountsDetail.length === 0) {
      throw new NotFoundException('Activity not found');
    }

    const accountDetail = accountsDetail[0];

    // To get Participant List
    const activityAccountParticipant: SFActivityAccountParticipant[] =
      await this.sfService.models.activities.get(
        'Contact__r.Id, Contact__r.Name',
        {
          Event__c: activityId,
          HasOptOut__c: false,
        },
      );

    // To check student is OptIn or not
    const paletteActivityDetailIsOptIn: SFPaletteActivityIsOptIn[] =
      await this.sfService.models.activities.get('HasOptOut__c', {
        Contact__c: studentId,
        Event__c: activityId,
        HasOptOut__c: false,
      });

    const isStudentOptIn = paletteActivityDetailIsOptIn.length > 0;

    const participantsList: Participant[] = activityAccountParticipant.map(
      (value) => ({
        id: value.Contact__r.Id,
        name: value.Contact__r.Name,
      }),
    );

    const activityDetail: ActivityDetail = {
      ...getMappedActivityObject(accountDetail),
      is_student_opt_in: isStudentOptIn,
      participants_list: participantsList,
    };

    return { statusCode: 200, data: activityDetail };
  }
}
