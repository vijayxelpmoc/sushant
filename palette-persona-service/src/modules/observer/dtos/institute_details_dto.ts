import { IsNotEmpty, Length } from 'class-validator';

export class InstituteDetails {
  @IsNotEmpty()
  @Length(4)
  institute_id: string;

  @IsNotEmpty()
  designation: string;
  hed__Contact__c: any;
  hed__Account__r: any;
}
