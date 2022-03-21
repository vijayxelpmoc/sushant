export interface Attributes {
  type: string;
  url: string;
}

// Representation of a Salesforce Contact object model
export interface SFContact {
  attributes: Attributes;
  Id: string;
  Name: string;
  prod_uuid__c: string;
  dev_uuid__c: string;
  Birthdate: string;
  hed__Gender__c: string;
  Grade__c: string;
  k12kit__Student_ID__c: string;
  Phone: string;
  Palette_Email__c: string;
  Interests__c: string;
  skills__c: string;
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
  Primary_Educational_Institution__c: string;
  Profile_Picture__c: string;
  AccountId: string;
}
