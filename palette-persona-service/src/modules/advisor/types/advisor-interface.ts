// export interface AdvisorBEResponse {
//     Id: string;
//     name: string;
//     firebase_uuid: string;
//     phone: string;
//     email: string;
//     profilePicture: string;
//     instituteId: string;
//     instituteLogo: string;
//     institute_name: string;
//     designation: string;
//     mailingCity: string;
//     mailingCountry: string;
//     mailingState: string;
//     mailingStreet: string;
//     mailingPostalCode: string;
//     facebook_link: string;
//     whatsapp_link: string;
//     instagram_link: string;
//     website_link: string;
//     website_Title: string;
//     github_link: string;
//     linkedin_link: string;
//   }
  
  interface Attributes {
    type: string;
    url: string;
  }
  
//   export interface AdvisorInstituteName {
//     attributes: Attributes;
//     Id: string;
//     Name: string;
//     program_logo__c: string;
//   }
  
//   export interface SFAdvisorContact {
//     attributes: Attributes;
//     Id: string;
//     Name: string;
//     prod_uuid__c: string;
//     dev_uuid__c: string;
//     Phone: string;
//     Palette_Email__c: string;
//     MailingCity: string;
//     MailingCountry: string;
//     MailingState: string;
//     MailingStreet: string;
//     MailingPostalCode: string;
//     Facebook__c: string;
//     Whatsapp__c: string;
//     Instagram__c: string;
//     Website__c: string;
//     WebsiteTitle__c: string;
//     Github__c: string;
//     LinkedIn_URL__c: string;
//     Designation__c: string;
//     AccountId: string;
//     Profile_Picture__c: string;
//   }
  
  export interface AdvisorUpdateResponse {
    id: string;
    success: boolean;
    errors: [];
  }
  
//   export interface AdvisorUpdateBEResponse {
//     status: number;
//     message: string;
//   }
  
//   interface AdvisorStudentData {
//     mentor: AdvisorBEResponse;
//     students: Array<{ Id: string; name: string }>;
//   }
  
//   export interface AdvisorStudents {
//     statusCode: number;
//     data: AdvisorStudentData;
//   }
  
//   interface hedContactr {
//     attributes: Attributes;
//     Name: string;
//   }
  
//   interface hedRelatedContactr {
//     attributes: Attributes;
//     Id: string;
//     Name: string;
//     Grade__c: string;
//     Primary_Educational_Institution__c: string;
//     Profile_Picture__c: string;
//     IsRegisteredOnPalette__c: boolean;
//     Palette_Email__c: string;
//     Is_Deactive__c: boolean;
//   }
  
//   export interface advisorStudentRelation {
//     attributes: Attributes;
//     Id: string;
//     Name: string;
//     hed__Contact__c: string;
//     hed__Contact__r: hedContactr;
//     hed__RelatedContact__r: hedRelatedContactr;
//     hed__Type__c: string;
//   }
  
//   export interface StudentResponse {
//     Id: string;
//     name: string;
//     grade: string;
//     institute: string;
//     profilePicture: string;
//     isRegistered: boolean;
//   }
  