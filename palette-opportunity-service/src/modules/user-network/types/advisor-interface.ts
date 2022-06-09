export interface AdvisorBEResponse {
  Id: string;
  name: string;
  firebase_uuid: string;
  phone: string;
  email: string;
  profilePicture: string;
  instituteId: string;
  instituteLogo: string;
  institute_name: string;
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
  accountName: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface AdvisorInstituteName {
  attributes: Attributes;
  Id: string;
  Name: string;
  program_logo: string;
}

export interface SFAdvisorContact {
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
  Designation: string;
  Account_Name: string;
  Profile_Picture: string;
}

export interface AdvisorUpdateResponse {
  id: string;
  success: boolean;
  errors: [];
}

export interface AdvisorUpdateBEResponse {
  status: number;
  message: string;
}

interface AdvisorStudentData {
  mentor: AdvisorBEResponse;
  students: Array<{ Id: string; name: string }>;
}

export interface AdvisorStudents {
  statusCode: number;
  data: AdvisorStudentData;
}

interface hedContactr {
  Id: string;
  attributes: Attributes;
  Name: string;
}

interface hedRelated_Contactr {
  attributes: Attributes;
  Id: string;
  Name: string;
  Grade: string;
  Primary_Educational_Institution: string;
  Profile_Picture: string;
  IsRegisteredOnPalette: boolean;
  Palette_Email: string;
  Is_Deactive: boolean;
}

export interface advisorStudentRelation {
  attributes: Attributes;
  Id: string;
  Name: string;
  Contact: hedRelated_Contactr;
  // Related_Contact: hedRelated_Contactr;
  Type: string;
}

export interface StudentResponse {
  Id: string;
  name: string;
  grade: string;
  institute: string;
  profilePicture: string;
  isRegistered: boolean;
}
