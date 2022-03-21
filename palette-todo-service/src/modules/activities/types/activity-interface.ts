// General Types
export type ActivityCategory =
  | 'Event - Volunteer'
  | 'Event - Arts'
  | 'Event - Sports'
  | 'Event - Social'
  | 'Other';

// Salesforce Response Types
export interface SFContactDetailInstitute {
  Id: string;
  Primary_Educational_Institution__c: string;
}

export interface ResponseInstituteEvents {
  statusCode: number;
  data: AllActivityResponseData[];
}

interface SFShippingAddress {
  city: string;
  country: string;
  postalCode: string;
  state: string;
  street: string;
}

export interface SFActivityAccountDetail {
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
  Listed_by__c: string;
  ParentId?: string;
}

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
}

export interface SFPaletteActivityOrganization {
  Event__r: SFActivityAccountDetail;
}

export interface SFPaletteActivity {
  Contact__c: string;
  Event__c: string;
}

export interface SFActivityAccountParticipant {
  Contact__r: {
    Id: string;
    Name: string;
  };
}

export interface SFPaletteActivityOptInOut {
  Id: string;
  HasOptOut__c: boolean;
}

export interface SFPaletteActivityIsOptIn {
  HasOptOut__c: boolean;
}

export interface SFRecommendationId {
  Id: string;
  attributes: Attributes;
}

// Backend Types
export interface Participant {
  id: string;
  name: string;
}

interface ShippingAddress {
  city: string;
  country: string;
  postal_code: string;
  state: string;
  street: string;
}
export interface Activity {
  activity_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: string;
  category: ActivityCategory;
  phone: string;
  website: string;
  shipping_address: ShippingAddress;
  ListedBy: string;
}

export interface ActivityDetail extends Activity {
  participants_list: Participant[];
  is_student_opt_in: boolean;
}

export interface ActivityInstitute extends Activity {
  institute: {
    Id: string;
    name: string;
  };
}

// Backend Response Types

interface ResponseType {
  statusCode: number;
}

export interface ActivitiesResponse extends ResponseType {
  data: {
    volunteeringActivities: Activity[];
    artsActivities: Activity[];
    sportsActivities: Activity[];
    socialEventsActivities: Activity[];
  };
}

export interface UpcomingActivitiesResponse extends ResponseType {
  data: {
    upcomingEvents: Activity[];
  };
}

export interface ActivityDetailResponse extends ResponseType {
  data: ActivityDetail;
}

export interface OptInOutActivityResponse extends ResponseType {
  message: string;
}

export interface AllActivityResponse {
  statusCode: number;
  data: AllActivityResponseData[];
}

export interface AllActivityResponseData {
  activity: ActivityInstitute;
  resources: {
    url: string;
    name: string;
    type: string;
  };
}

// ------------------------ recommendations types --------------------------------------------------------
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

export interface SFRecommendationMin {
  attributes: Attributes;
  Id: string;
  Assignee__c: string;
  Recommended_by__c: string;
  Event__c: string;
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

export interface ResponseRecommendations {
  statusCode: 200;
  data: RecommendationsData[];
}
