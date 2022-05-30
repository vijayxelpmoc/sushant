export interface User {
  Id: string;
  Name: string;
  Contact_Record_Type: string;
  Palette_Email: string;
  Palette_Key: string;
  Phone: string;
  IsRegisteredOnPalette: boolean;
  Record_Type_Name: string;
  prod_uuid: string;
  dev_uuid: string;
  Is_Deactive: boolean;
}

// export enum Roles {
//   Student = 'Student',
//   Guardian = 'Guardian',
//   Admin = 'Admin',
//   Observer = 'Observer',
//   Advisor = 'Advisor',
//   Faculty = 'Faculty/Staff',
// }

export enum Roles {
  Student = 'Student',
  Guardian = 'Guardian',
  Admin = 'Administrator',
  Observer = 'Observer',
  Advisor = 'Advisor',
  Faculty = 'Faculty/Staff',
}