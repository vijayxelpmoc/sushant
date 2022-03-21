import { ApiProperty } from '@nestjs/swagger';

export class AdminData {
  @ApiProperty()
  Id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  profilePicture: string;
  @ApiProperty()
  instituteId: string;
  @ApiProperty()
  institute_name: string;
  @ApiProperty()
  instituteLogo: string;
  @ApiProperty()
  designation: string;
  @ApiProperty()
  mailingCity: string;
  @ApiProperty()
  mailingCountry: string;
  @ApiProperty()
  mailingState: string;
  @ApiProperty()
  mailingStreet: string;
  @ApiProperty()
  mailingPostalCode: string;
  @ApiProperty()
  facebook_link: string;
  @ApiProperty()
  whatsapp_link: string;
  @ApiProperty()
  instagram_link: string;
  @ApiProperty()
  website_link: string;
  @ApiProperty()
  website_Title: string;
  @ApiProperty()
  github_link: string;
  @ApiProperty()
  linkedin_link: string;

}

export class AdminBEResponse {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: AdminData;
}

interface Attributes {
  type: string;
  url: string;
}

export interface AdminInstituteName {
  attributes: Attributes;
  Name: string;
  Id: string;
  program_logo__c: string;
}

export interface SFAdminContact {
  attributes: Attributes;
  Id: string;
  Name: string;
  Phone: string;
  Palette_Email__c: string;
  MailingCity: string;
  MailingCountry: string;
  MailingState: string;
  MailingStreet: string;
  MailingPostalCode: string;
  Facebook__c: string;
  Whatsapp__c: string;
  Instagram__c: string;
  Website__c: string;
  WebsiteTitle__c: string;
  Github__c: string;
  LinkedIn_URL__c: string;
  Designation__c: string;
  AccountId: string;
  Profile_Picture__c: string;
}

export interface AdminUpdateResponse {
  id: string;
  success: boolean;
  errors: [];
}

export interface AdminUpdateBEResponse {
  statusCode: number;
  message: string;
}

export class AdminUpdateBEResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
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

interface ApprovalOpportunity {
  Id: string;
  eventName: string;
  description: string;
  venue: string;
  website: string;
  eventDate: Date;
  Type: string;
  approvalStatus: string;
  expirationDate: Date;
}

export interface ApprovalsDataResponse {
  statusCode: number;
  message: string;
  data: ApprovalOpportunity[];
}

export class ApprovalsDataResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: ApprovalOpportunity[];
}

export interface ApprovalDataResponse {
  statusCode: number;
  message: string;
  data: ApprovalOpportunity;
}

export interface ApprovalTodo {
  id: string;
  name: string;
  description: string;
  taskStatus: string;
  type: string;
  completeBy: string;
  listedBy: string;
  eventAt?: string;
  eventVenue?: string;
  approvalStatus: string;
  instituteId: string;
}

export interface ApprovalTodoResponse {
  statusCode: number;
  message: string;
  data: ApprovalTodo;
}

export interface ApprovalsTodoResponse {
  statusCode: number;
  message: string;
  data: ApprovalTodo[];
}

export class ApprovalsTodoResponseDto {
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: ApprovalTodo[];
}
