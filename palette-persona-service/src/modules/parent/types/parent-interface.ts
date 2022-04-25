export interface Attributes {
    type: string;
    url: string;
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

export interface ParentStudentListSF {
    attributes: Attributes;
    Id: string;
    Name: string;
    // Contact: string;
    Type: string;
    Relationship_Explanation: string;
    Related_Contact: string;
    Contact: {
      attributes: Attributes;
      Id,
      Name: string;
      Profile_Picture: string;
      Is_Deactive: boolean;
    };
    Description: string;
  }

  export interface ParentInstituteName {
    attributes: Attributes;
    Id: string;
    Account_Name: string;
    program_logo: string;
  }

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
  }