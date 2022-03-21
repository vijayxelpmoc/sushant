import { Attributes } from '@src/types';

export interface SFStudentWorkExperience {
  attributes: Attributes;
  Id: string;
  Name: string;
  hed__Account__c: string;
  hed__Affiliation_Type__c: string;
  hed__Contact__c: string;
  hed__EndDate__c: string;
  hed__StartDate__c: string;
  hed__Role__c: string;
  Tenure__c: any;
  hed__Description__c: string;
  Job_Type__c: string;
  Designation__c: string;
}

export interface WorkExperience {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
}
