import { ApiProperty } from '@nestjs/swagger';

export interface AdminBEResponse {
  Id: string;
  name: string;
  firebase_uuid: string;
  phone: string;
  email: string;
  profilePicture: string;
  instituteId: string;
  institute_name: string;
  instituteLogo: string;
  designation: string;
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

export class AdminBEResponse {
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

interface Attributes {
  type: string;
  url: string;
}

export interface AdminInstituteName {
  attributes: Attributes;
  Name: string;
  Id: string;
  program_logo: string;
}

export interface SFAdminContact {
  attributes: Attributes;
  Id: string;
  prod_uuid: string;
  dev_uuid: string;
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
  WebsiteTitle: string;
  Github: string;
  LinkedIn_URL: string;
  Designation: string;
  AccountId: string;
  Profile_Picture: string;
}

export interface AdminUpdateResponse {
  id: string;
  success: boolean;
  errors: [];
}

export interface AdminUpdateBEResponse {
  status: number;
  message: string;
}

export class AdminUpdateBEResponseDto {
  @ApiProperty()
  status: number;

  @ApiProperty()
  message: string;
}

export interface SFInstitute {
  attributes: Attributes;
  Id: string;
  Name: string;
  Organization: { Id: string; Account_Name: string };
}

export interface SFStudents {
  attributes: Attributes;
  Id: string;
  Name: string;
  Grade: string;
  Is_Deactive: boolean;
  Profile_Picture: string;
  Primary_Educational_Institution: string;
  IsRegisteredOnPalette: boolean;
}

export interface SFAdmins {
  attributes: Attributes;
  Contact: {
    Id: string;
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
  role: string;
}
export interface ObserverParentResponse {
  Id: string;
  name: string;
  instituteName: string;
  designation: string;
  role:string;
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
  Type: string;
  Contact: {
    attributes: Attributes;
    Primary_Educational_Institution: string;
    Designation: string;
  };
  Related_Contact: {
    Id: string;
    attributes: Attributes;
    Name: string;
    Profile_Picture: string;
    Palette_Email: string;
    Is_Deactive: boolean;
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
