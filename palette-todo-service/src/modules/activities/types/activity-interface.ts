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
  Primary_Educational_Institution: string;
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
  Start_Date: string;
  End_Date: string;
  Venue: string;
  Category: ActivityCategory;
  ShippingAddress: SFShippingAddress;
  Phone: string;
  Website: string;
  Listed_by: string;
  ParentId?: string;
}

export interface SFActivityActivityDetail {
  Id: string;
  Name: string;
  Description: string;
  Start_Date: string;
  End_Date: string;
  Venue: string;
  Category: ActivityCategory;
  ShippingAddress: SFShippingAddress;
  Phone: string;
  Website: string;
  CreatedById: string;
  Listed_by: string;
}

export interface SFActivityActivityDetail {
  Id: string;
  Name: string;
  Description: string;
  Start_Date: string;
  End_Date: string;
  Venue: string;
  Category: ActivityCategory;
  ShippingAddress: SFShippingAddress;
  Phone: string;
  Website: string;
  CreatedById: string;
}

export interface SFPaletteActivityOrganization {
  Event: SFActivityAccountDetail;
}

export interface SFPaletteActivity {
  Contact: string;
  Event: string;
}

export interface SFActivityAccountParticipant {
  Contact: {
    Id: string;
    Name: string;
  };
}

export interface SFPaletteActivityOptInOut {
  Id: string;
  HasOptOut: boolean;
}

export interface SFPaletteActivityIsOptIn {
  HasOptOut: boolean;
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
  Assignee: string;
  Recommended_by: {
    attributes: Attributes;
    Name: string;
    Record_Type_Name: string;
  };
  Event: {
    attributes: Attributes;
    Name: string;
    Description: string;
    Start_Date: string;
    End_Date: string;
    Category: string;
    Venue: string;
    Phone: string;
    Website: string;
  };
  Accepted: string;
}

export interface SFRecommendationMin {
  attributes: Attributes;
  Id: string;
  Assignee: string;
  Recommended_by: string;
  Event: string;
  Accepted: string;
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
