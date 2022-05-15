import { Attributes } from '@src/types';

export interface SFStudentWorkExperience {
  attributes: Attributes;
  Id: string;
  Name: string;
  Organization: string;
  Affiliation_Type: string;
  Contact: string;
  End_Date: string;
  Start_Date: string;
  Role: string;
  Tenure: any;
  Description: string;
  Job_Type: string;
  Designation: string;
}

export interface WorkExperience {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface StudentInstituteName {
  attributes: Attributes;
  Id: string;
  Account_Name: string;
  program_logo: string;
}
