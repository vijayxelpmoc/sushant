export interface ObserverInstitute {
  institute_id: string;
  institute_name: string;
  designation: string;
}

export interface ObserverBEResponse {
  Id: string;
  name: string;
  phone: string;
  email: string;
  profilePicture: string;
  institutes: ObserverInstitute[];
  mailingCity: string;
  mailingCountry: string;
  mailingState: string;
  mailingStreet: string;
  mailingPostalCode: string;
  facebook_link: string;
  whatsapp_link: string;
  instagram_link: string;
  website_link: string;
  website_Title: string;
  github_link: string;
  linkedin_link: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface ObserverSFInstitutesList {
  attributes: Attributes;
  Id: string;
  Affiliation_Name: string;
  Organization: string;
  Affiliation_Type: string;
  Contact: string;
  End_Date: string;
  Start_Date: string;
  Role: string;
  Tenure: string;
  Description: string;
  Designation: string;
}
export interface SFObserverContact {
  attributes: Attributes;
  Id: string;
  Name: string;
  Phone: string;
  Palette_Email: string;
  MailingCity: string;
  MailingCountry: string;
  MailingState: string;
  MailingStreet: string;
  MailingPostalCode: string;
  Facebook: string;
  Whatsapp: string;
  Instagram: string;
  Website: string;
  Website_Title: string;
  Github: string;
  LinkedIn_URL: string;
  Profile_Picture: string;
}

export interface ObserverUpdateResponse {
  id: string;
  success: boolean;
  errors: [];
}

export interface ObserverUpdateBEResponse {
  status: number;
  message: string;
}

export interface SFInstitute {
  attributes: Attributes;
  Id: string;
  Name: string;
}

export interface SFStudentsObserver {
  attributes: Attributes;
  hed__Contact__c: string;
  hed__Contact__r: SFStudentDetails;
}

export interface SFMentorStudents {
  attributes: Attributes;
  hed__Contact__c: string;
  hed__Type__c: string;
  hed__RelatedContact__r: SFMentorDetails;
}
export interface SFMentorStudentsInstitute {
  attributes: Attributes;
  hed__Contact__c: string;
  hed__Type__c: string;
  hed__RelatedContact__r: SFStudentAndInstituteDetails;
}

export interface SFStudentDetails {
  Name: string;
  Grade__c: string;
  Is_Deactive__c: boolean;
}
export interface SFStudentAndInstituteDetails {
  Name: string;
  Grade__c: string;
  Primary_Educational_Institution__c: string;
  Is_Deactive__c: boolean;
}

export interface SFMentorDetails {
  Id: string;
  Name: string;
  Designation__c: string;
  Profile_Picture__c: string;
  IsRegisteredOnPalette__c: string;
  Palette_Email__c: string;
  Is_Deactive__c: boolean;
}

export interface SFInstituteDetails {
  attributes: Attributes;
  hed__Contact__c: string;
  hed__Account__r: {
    Name: string;
  };
}

export interface ObserverDetails {
  statusCode: number;
  data: {
    students: StudentDetails[];
    mentors: MentorDetails[];
  };
}
export interface ObserverDetailsInstitute {
  statusCode: number;
  data: {
    students: StudentDetails[];
    mentors: MentorDetails[];
    institute: string[];
  };
}

export interface StudentDetails {
  Id: string;
  name: string;
  grade: string;
}
export interface MentorDetails {
  Id: string;
  name: string;
  designation: string;
  institute: string;
}

export interface ObserverStudentRelationsSF {
  Attributes: Attributes;
  hed__RelatedContact__c: string;
  hed__Type__c: string;
  hed__RelatedContact__r: {
    Name: string;
    Palette_Email__c: string;
    Profile_Picture__c: string;
    IsRegisteredOnPalette__c: string;
    Is_Deactive__c: boolean;
  };
}

export const MentorSubRoles: string[] = ['Advisor', 'Mentor'];

export const ObserverSubRoles: string[] = [
  'Aunt',
  'Uncle',
  "Parent's Sibling",
  'Grandmother',
  'Grandfather',
  'Grandparent',
  'Employer',
  'Observer',
  'Husband',
  'Wife',
  'Cousin',
  'Family',
  'Steps',
  'Coworker',
];
