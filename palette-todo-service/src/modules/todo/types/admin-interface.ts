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

export interface StudentResponse {
  Id: string;
  name: string;
  institute: string;
  grade: string;
}

export interface MentorParentResponse {
  Id: string;
  name: string;
  instituteName: string;
  designation: string;
}
export interface ObserverParentResponse {
  Id: string;
  name: string;
  instituteName: string;
  designation: string;
}
export interface ObserverParentResponse {
  Id: string;
  name: string;
  instituteName: string;
}

export interface InstituteDetailsResponse {
  statusCode: number;
  data: {
    students: StudentResponse[];
    mentors: MentorParentResponse[];
    parents: MentorParentResponse[];
    observers: ObserverParentResponse[];
    admins: ObserverParentResponse[];
  };
}

export interface StudentConnectionResponseSF {
  attributes: Attributes;
  hed__RelatedContact__c: string;
  hed__Type__c: string;
  hed__Contact__r: {
    attributes: Attributes;
    Primary_Educational_Institution__c: string;
    Designation__c: string;
  };
  hed__RelatedContact__r: {
    attributes: Attributes;
    Name: string;
    Profile_Picture__c: string;
    Palette_Email__c: string;
    Is_Deactive__c: boolean;
  };
}
