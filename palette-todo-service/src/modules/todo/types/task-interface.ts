export interface Task {
  Id: string;
  groupId: string;
  Assignee: object;
  AssigneeName: string;
  Assignee_accepted_status: string;
  profilePicture: string;
  Archived: boolean;
  name: string;
  description: string;
  TaskStatus: string;
  status: string;
  todoScope: string;
  type: string;
  eventAt: string;
  venue: string;
  completeBy: string;
  createdAt: string;
  createdBy: string;
  Listed_by: string;
  opportunity: string;
}

export interface ResponseResources {
  name: string;
  url: string;
  type: string;
}

export interface ResponseTasksDetails {
  task: {
    Id: string;
    name: string;
    description: string;
    status: string;
    completeBy: string;
    createdAt: string;
    Listed_by: {
      Id: string;
      Name: string;
    };
  };
  resources: ResponseResources[];
}
export interface ResponseToDo {
  statusCode: number;
  data: ResponseTasksDetails[];
}

export interface FilteredTasks {
  filteredTasks: Task[];
  taskIds: any[];
}
