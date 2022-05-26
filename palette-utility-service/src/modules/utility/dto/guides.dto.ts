export interface GetGuidesResponse {
    name: string;
    description: string;
    event_string: string;
  }
  
  interface GetGuidesAttributes {
    type: string;
    url: string;
  }
  
  export interface GetGuidesSFResponse {
    attributes: GetGuidesAttributes;
    Guide_Name: string;
    Guide_Description: string;
    Event_String: string;
    Role: string;
  }
  