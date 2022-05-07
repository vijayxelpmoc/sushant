import { ApiProduces, ApiProperty } from '@nestjs/swagger';

export interface ObserverInstitute {
  institute_id: string;
  institute_name: string;
  designation: string;
  instituteLogo: string;
}

export interface ObserverBEResponse {
  Id: string;
  name: string;
  firebase_uuid: string;
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

export class ObserverBEResponseDto {
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
  institutes: ObserverInstitute[];
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

export interface ObserverSFInstitutesList {
  attributes: Attributes;
  Id: string;
  Name: string;
  Account: string;
  Affiliation_Type: string;
  Contact: string;
  EndDate: string;
  StartDate: string;
  Role: string;
  Tenure: string;
  Description: string;
  Designation: string;
}

export interface SFObserverContact {
  attributes: Attributes;
  Id: string;
  Name: string;
  prod_uuid: string;
  dev_uuid: string;
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
  AccountId: string;
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
  Contact: SFStudentDetails;
}

export interface SFMentorStudents {
  attributes: Attributes;
  Contact: string;
  Type: string;
  Related_Contact: SFMentorDetails;
}
export interface SFMentorStudentsInstitute {
  attributes: Attributes;
  Contact: string;
  Type: string;
  Related_Contact: SFStudentAndInstituteDetails;
}

export interface SFStudentDetails {
  Id: string;
  Name: string;
  Grade: string;
  Is_Deactive: boolean;
}
export interface SFStudentAndInstituteDetails {
  Name: string;
  Grade: string;
  Primary_Educational_Institution: string;
  Is_Deactive: boolean;
}

export interface SFMentorDetails {
  Id: string;
  Name: string;
  Designation: string;
  Profile_Picture: string;
  IsRegisteredOnPalette: string;
  Palette_Email: string;
  Is_Deactive: boolean;
}

export interface SFInstituteDetails {
  attributes: Attributes;
  Contact: string;
  Account: {
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

export class StudentDetailsDto {
  @ApiProperty()
  Id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  grade: string;
}
export class MentorDetailsDto {
  @ApiProperty()
  Id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  designation: string;

  @ApiProperty()
  institute: string;
}

export class observerInstiData {
  @ApiProperty()
  students: StudentDetailsDto[];

  @ApiProperty()
  mentors: MentorDetailsDto[];

  @ApiProperty()
  institute: string[];
}

export class ObserverDetailsInstituteDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  data: observerInstiData;
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
  Type: string;
  Related_Contact: {
    Id: string;
    Name: string;
    Palette_Email: string;
    Profile_Picture: string;
    IsRegisteredOnPalette: string;
    Is_Deactive: boolean;
  };
}
