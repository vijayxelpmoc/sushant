export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum EmailTemplates {
  PASSWORD_RESET = 'PASSWORD_RESET',
}

interface KeyValue {
  [key: string]: string | number;
}

interface EmailTemplateAttrs {
  template: EmailTemplates;
  context: KeyValue;
}

export interface NotificationTypeEmail {
  to: string | string[];
  subject: string;
  coupled?: boolean;
  useTemplate?: boolean;
  body?: string;
  templateAttrs?: EmailTemplateAttrs;
}

export interface NotificationTypeSMS {
  phoneNumber: string | string[];
  body: string;
}

export interface NotificationTypePush {
  userId: string;
  title: string;
  notificationId: string;
}

export interface ProcessedRecord {
  id: string;
  timestamp: string;
  type: NotificationType;
  body: NotificationTypeEmail | NotificationTypeSMS | NotificationTypePush;
}

export interface FailedRecord {
  messageId: string;
  receiptHandle: string;
  eventSourceARN: string;
  awsRegion: string;
}

export interface PushNotificationPayload {
  id: string;
  timestamp: string;
  body: NotificationTypePush;
  caller: string;
}

interface Attributes {
  type: string;
  url: string;
}

export interface SFTask {
  attributes: Attributes;
  Id: string;
  Group_Id: string;
  Archived: boolean;
  To_do: string;
  Task_Status: string;
  Assignee: {
    Id:string;
    Name: string;
    Profile_Picture: string;
  };
  Reminder_at: string;
  Status: string;
  Complete_By: string;
  Description: string;
  Listed_by: string;
  Task_status: string;
  Assignee_accepted_status: string;
  Todo_Scope: string;
  Created_at: string;
  CreatedDate: string;
  CreatedById: string;
  Type: string;
  Event_At: string;
  Event_Venue: string;
  Opportunity_Id: string;
}

export interface SFResource {
  attributes: Attributes;
  Name: string;
  Todo: string;
  Resource: {
    Id: string;
    attributes: Attributes;
    Name: string;
    URL: string;
    Resource_Type: string;
  };
}

export interface SFEventResource {
  attributes: Attributes;
  Id: string;
  Name: string;
  Event: string;
  Resource: {
    attributes: Attributes;
    Name: string;
    URL: string;
    Resource_Type: string;
  };
}

export interface SFUser {
  attributes: Attributes;
  Name: string;
  Id: string;
}

export interface SFContact {
  attributes: Attributes;
  Name: string;
  Id: string;
}

export interface ResponseToDo {
  statusCode: number;
  data: ResponseTasksDetails[];
}

export interface Task {
  Id: string;
  groupId: string;
  Assignee: string;
  AssigneeName: string;
  profilePicture: string;
  Archived: boolean;
  acceptedStatus: string;
  todoScope: string;
  name: string;
  description: string;
  reminderAt: string;
  status: string;
  taskStatus: string;
  type: string;
  eventAt: string;
  venue: string;
  completeBy: string;
  createdAt: string;
  listedBy: {
    Id: string;
    Name: string;
  };
  opportunity?: string;
}

export interface ResponseTasksDetails {
  task: {
    Id: string;
    name: string;
    description: string;
    status: string;
    completeBy: string;
    createdAt: string;
    listedBy: {
      Id: string;
      Name: string;
    };
  };
  resources: ResponseResources[];
}

export interface ResponseResources {
  name: string;
  url: string;
  type: string;
}

export interface TodoResourceConnection {
  Todo: string;
  Resource: string;
}

export interface CreateTodo {
  name: string;
  Description: string;
  status: string;
  approved_status: string;
  type: string;
  venue?: string;
  eventAt?: string;
  completeBy?: string;
  assignee: string[];
  listedBy: string;
}

export interface SFEventEnrollment {
  attributes: Attributes;
  Contact: string;
  Event: string;
}

export enum GetTodoFilterType {
  assignee = 'assignee',
  listedBy = 'listedby',
}

export interface getTodoResponse {
  filteredTasks: Task[];
  taskIds: any[];
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
