interface Attributes {
  type: string;
  url: string;
}
export interface SFRecommendations {
  attributes: Attributes;
  Id: string;
  Name: string;
  Assignee__c: string;
  Recommended_by__c: string;
  Recommended_by__r: {
    attributes: Attributes;
    Name: string;
    Record_Type_Name__c: string;
  };
  Event__c: string;
  Event__r: {
    attributes: Attributes;
    Name: string;
    Description: string;
    Start_Date__c: string;
    End_Date__c: string;
    Category__c: string;
    Venue__c: string;
    Phone: string;
    Website: string;
  };
  Accepted__c: string;
}

export interface RecommendationsData {
  Id: string[];
  recommendedBy: {
    Id: string;
    Name: string;
  }[];
  event: {
    Id: string;
    Name: string;
    Description: string;
    Category: string;
    StartDate: string;
    EndDate: string;
    Venue: string;
  };
}
export interface SFEventEnrollment {
  attributes: Attributes;
  Contact__c: string;
  Event__c: string;
}
export interface SFEventResource {
  attributes: Attributes;
  Id: string;
  Name: string;
  Event__c: string;
  Resource__r: {
    attributes: Attributes;
    Name: string;
    URL__c: string;
    Resource_Type__c: string;
  };
}
interface SFShippingAddress {
  city: string;
  country: string;
  postalCode: string;
  state: string;
  street: string;
}
export type ActivityCategory =
  | 'Event - Volunteer'
  | 'Event - Arts'
  | 'Event - Sports'
  | 'Event - Social'
  | 'Other';
export interface SFActivityActivityDetail {
  Id: string;
  Name: string;
  Description: string;
  Start_Date__c: string;
  End_Date__c: string;
  Venue__c: string;
  Category__c: ActivityCategory;
  ShippingAddress: SFShippingAddress;
  Phone: string;
  Website: string;
  CreatedById: string;
  Listed_by__c: string;
}

export interface SFRecommendationId {
  Id: string;
  attributes: Attributes;
}
