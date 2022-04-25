export interface Attributes {
  type: string;
  url: string;
}

// Representation of a Salesforce Contact object model
export interface SFContact {
  attributes: Attributes;
  Id: string;
  Name: string;
  prod_uuid: string;
  dev_uuid: string;
  Birthdate: string;
  Gender: string;
  Grade: string;
  Student_ID: string;
  Phone: string;
  Palette_Email: string;
  Interests: string;
  skills: string;
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
  Primary_Educational_Institution: string;
  Profile_Picture: string;
  Account_Name: string;
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
  Website_Title: string;
  Github: string;
  LinkedIn_URL: string;
  Designation: string;
  Account_Name: string;
  Profile_Picture: string;
}

export interface AdminInstituteName {
  attributes: Attributes;
  Account_Name: string;
  Id: string;
  program_logo: string;
}

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

export interface SFAdvisorContact {
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
  Website_Title: string;
  Github: string;
  LinkedIn_URL: string;
  Designation: string;
  Account_Name: string;
  Profile_Picture: string;
}

export interface AdvisorInstituteName {
  attributes: Attributes;
  Account_Name: string;
  Id: string;
  program_logo: string;
}

export interface AdvisorBEResponse {
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
