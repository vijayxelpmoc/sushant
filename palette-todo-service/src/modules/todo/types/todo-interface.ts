import { ApprovedStatus, Status, TodoType } from "../dtos";
import { Task } from "./task-interface";

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

export interface getTodoResponse {
  filteredTasks: Task[];
  taskIds: any[];
}

export interface CreateTodo {
  name: string;
  description: string;
  status: string;
  type: string;
  venue?: string;
  eventAt?: string;
  completeBy?: string;
  assignee: string[];
  listedBy: string;
  instituteId: string;
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
  RelatedContact: string;
  Type: string;
  Contact__r: {
    attributes: Attributes;
    Primary_Educational_Institution: string;
    Designation: string;
  };
  RelatedContact__r: {
    attributes: Attributes;
    Name: string;
    Profile_Picture: string;
    Palette_Email: string;
    Is_Deactive: boolean;
  };
}

export interface TodoResourceConnection {
  Todo: string;
  Resource: string;
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
