import { ApiProduces, ApiProperty } from '@nestjs/swagger';

interface Pupil {
  Id: string;
  Name: string;
}

export interface ParentBEResponse {
  Id: string;
  name: string;
  firebase_uuid: string;
  phone: string;
  instituteId: string;
  instituteLogo: string;
  institute_name: string;
  email: string;
  profilePicture: string;
  pupils: Pupil[];
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
  accountName: string;
}

export class ParentBEResponseDto {
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
  pupils: Pupil[];
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

export interface SFParentContact {
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
  Account_Name: string;
  Primary_Educational_Institution: string;
}

export interface ParentInstituteName {
  attributes: Attributes;
  Id: string;
  Name: string;
  program_logo: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface ParentStudentListSF {
  attributes: Attributes;
  Id: string;
  Name: string;
  Type: string;
  Relationship_Explanation: string;
  RelatedContact: string;
  Contact: {
    Id: string;
    attributes: Attributes;
    Name: string;
    Profile_Picture: string;
    Is_Deactive: boolean;
  };
  Description: string;
}

export interface ParentUpdateResponse {
  id: string;
  success: boolean;
  errors: [];
}

export interface ParentUpdateBEResponse {
  status: number;
  message: string;
}

export interface EducationalInstitutionSF {
  attributes: any;
  Primary_Educational_Institution: {
    Id: string;
    attributes: any;
    Name: string;
  };
}

export interface Institutes {
  Id: string;
  Name: string;
}

export class InstitutesDto {
  @ApiProperty()
  Id: string;

  @ApiProperty()
  Name: string;
}
