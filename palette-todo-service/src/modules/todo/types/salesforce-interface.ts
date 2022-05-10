interface Attributes {
  type: string;
  url: string;
}

export interface SFInstitute {
  attributes: Attributes;
  Id: string;
  Name: string;
  Account: { Name: string };
}

export interface SFStudents {
  attributes: Attributes;
  Id: {
    attributes: Attributes;
    Name: string;
    Profile_Picture: string;
    Palette_Email: string;
    Is_Deactive: boolean;
  };
  Name: string;
  Grade: string;
  Is_Deactive: boolean;
  Profile_Picture: string;
  Primary_Educational_Institution: {
    Name: string;
  };
  isRegistered: string;
}

export interface SFAdmins {
  attributes: Attributes;
  Contact: {
    attributes: Attributes;
    Name: string;
    Profile_Picture: string;
    IsRegisteredOnPalette: string;
    Is_Deactive: boolean;
  };
  Role: string;
}
export interface SFMentors {
  attributes: Attributes;
  Id: string;
  Name: string;
  Account: string;
  Affiliation_Type: string;
  Description: string;
  Role: string;
  Contact: {
    attributes: Attributes;
    Id: string;
    Name: string;
    Designation: string;
    Profile_Picture: string;
    IsRegisteredOnPalette: string;
    Palette_Email: string;
    Is_Deactive: boolean;
  };
}

export interface SFTodo {
  Name: string;
  Description: string;
  Task_Status: string;
  Type: string;
  Complete_By: string;
  Listed_by: string;
  Group_Id: string;
  Event_At?: string;
  Event_Venue?: string;
  Assignee?: string;
  Todo_Scope?: string;
  Status?: string;
  Parentid?: string;
  Reminder_at?: string;
  Assignee_accepted_status?: string;
  Opportunit_Id?: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface SFTask {
  attributes: Attributes;
  Id: string;
  Group_Id: string;
  Archived: boolean;
  To_do: string;
  Assignee?: {
    Id: string;
    Name: string;
    Profile_Picture: string;
  };
  Complete_By: string;
  Description: string;
  Listed_by: string;
  Status: string;
  Task_Status: string;
  Todo_Scope: string;
  Created_at: string;
  Created_By: string;
  Type: string;
  Event_At: string;
  Event_Venue: string;
  Assignee_accepted_status?: string;
  Opportunit_Id: string;
}

export interface SFResource {
  attributes: Attributes;
  Name: string;
  Todo: string;
  Resource: {
    Id: string;
    attributes: Attributes;
    Resource_Name: string;
    URL: string;
    Resource_Type: string;
  };
}

export interface SFEventResource {
  attributes: Attributes;
  Id: string;
  Name: string;
  Event: string;
  Resource: {
    attributes: Attributes;
    Resource_Name: string;
    URL: string;
    Resource_Type: string;
  };
}
interface SFShipping_Address {
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
  Contact: string;
  Event: string;
}
export interface SFActivityActivityDetail {
  Id: string;
  Name: string;
  Description: string;
  Start_Date: string;
  End_Date: string;
  Venue: string;
  Category: ActivityCategory;
  Shipping_Address: SFShipping_Address;
  Phone: string;
  Website: string;
  Created_By: string;
  Listed_by: string;
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
