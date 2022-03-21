export interface User {
  Id: string;
  Name: string;
  RecordTypeId: string;
  Palette_Email__c: string;
  Palette_Key__c: string;
  Phone: string;
  IsRegisteredOnPalette__c: boolean;
  Record_Type_Name__c: string;
  prod_uuid__c: string;
  dev_uuid__c: string;
  Is_Deactive__c: boolean;
}

export enum Roles {
  Student = 'Student',
  Guardian = 'Guardian',
  Admin = 'Admin',
  Observer = 'Observer',
  Advisor = 'Advisor',
  Faculty = 'Faculty/Staff',
}
