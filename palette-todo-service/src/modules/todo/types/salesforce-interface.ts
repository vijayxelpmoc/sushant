interface Attributes {
  type: string;
  url: string;
}

export interface SFInstitute {
  attributes: Attributes;
  Id: string;
  Name: string;
  hed__Account__c: string;
  hed__Account__r: { Name: string };
}

export interface SFStudents {
  attributes: Attributes;
  Id: string;
  Name: string;
  Grade__c: string;
  Is_Deactive__c: boolean;
  Profile_Picture__c: string;
  Primary_Educational_Institution__r: {
    Name: string;
  };
  isRegistered: string;
}

export interface SFAdmins {
  attributes: Attributes;
  hed__Contact__c: string;
  hed__Contact__r: {
    attributes: Attributes;
    Name: string;
    Profile_Picture__c: string;
    IsRegisteredOnPalette__c: string;
    Is_Deactive__c: boolean;
  };
  hed__Role__c: string;
}
export interface SFMentors {
  attributes: Attributes;
  Id: string;
  Name: string;
  hed__Account__c: string;
  hed__Affiliation_Type__c: string;
  hed__Contact__c: string;
  hed__Description__c: string;
  hed__Role__c: string;
  hed__Contact__r: {
    attributes: Attributes;
    Id: string;
    Name: string;
    Designation__c: string;
    Profile_Picture__c: string;
    IsRegisteredOnPalette__c: string;
    Palette_Email__c: string;
    Is_Deactive__c: boolean;
  };
}

export interface SFTodo {
  Name: string;
  Description__c: string;
  Task_status__c: string;
  Type__c: string;
  Complete_By__c: string;
  Listed_by__c: string;
  Group_Id__c: string;
  Event_At__c?: string;
  Event_Venue__c?: string;
  Assignee__c?: string;
  Todo_Scope__c?: string;
  Status__c?: string;
  Parentid__c?: string;
  Assignee_accepted_status__c?: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface SFTask {
  attributes: Attributes;
  Id: string;
  Group_Id__c: string;
  Archived__c: boolean;
  Name: string;
  Assignee__c: string;
  Assignee__r: {
    Name: string;
    Profile_Picture__c: string;
  };
  Complete_By__c: string;
  Description__c: string;
  Listed_by__c: string;
  Task_status__c: string;
  Created_at__c: string;
  CreatedById: string;
  Type__c: string;
  Event_At__c: string;
  Event_Venue__c: string;
}

export interface SFResource {
  attributes: Attributes;
  Name: string;
  Todo__c: string;
  Resource__r: {
    Id: string;
    attributes: Attributes;
    Name: string;
    URL__c: string;
    Resource_Type__c: string;
  };
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

export interface SFEventEnrollment {
  attributes: Attributes;
  Contact__c: string;
  Event__c: string;
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

export interface SFUser {
  attributes: Attributes;
  Name: string;
  Id: string;
}

export interface SFContact {
  attributes: Attributes;
  Name: string;
  Id: string;
}
