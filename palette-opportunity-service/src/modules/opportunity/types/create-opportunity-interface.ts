export interface CreatedByUserOpportunity {
  Id: string;
  evenName: Date;
  description: string;
  venue: string;
  website: string;
  eventDate: string;
  phone: string;
  type: string;
  visibility: string;
  expirationDateTime: string;
  status: string;
  opportunityScope: string;
  Venue__c: string;
}

export interface InstituteDataResponse {
  statusCode: number;
  message: string;
  InstituteID: string;
  data: any;
}
