interface Attributes {
  type: string;
  url: string;
}

export interface StudentResponse {
  Id: string;
  name: string;
  institute: string;
  grade: string;
}

export interface MentorParentResponse {
  Id: string;
  name: string;
  instituteName: string;
  designation: string;
}
export interface ObserverParentResponse {
  Id: string;
  name: string;
  instituteName: string;
  designation: string;
}
export interface ObserverParentResponse {
  Id: string;
  name: string;
  instituteName: string;
}

export interface StudentConnectionResponseSF {
  attributes: Attributes;
  hed__RelatedContact__c: string;
  hed__Type__c: string;
  hed__Contact__r: {
    attributes: Attributes;
    Primary_Educational_Institution__c: string;
    Designation__c: string;
  };
  hed__RelatedContact__r: {
    attributes: Attributes;
    Name: string;
    Profile_Picture__c: string;
    Palette_Email__c: string;
    Is_Deactive__c: boolean;
  };
}

export interface TodoResourceConnection {
  Todo__c: string;
  Resource__c: string;
}

export interface TodoNotificationData {
  notifyTo: 'listedBy' | 'assignee';
  title: string;
  message: string;
  groupId: string;
  todoId: string;
  assigneeId: string;
  listedById: string;
}
