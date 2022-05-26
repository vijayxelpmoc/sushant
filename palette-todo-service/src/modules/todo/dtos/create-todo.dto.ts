import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Status {
  Open = 'Open',
  Completed = 'Completed',
  In_progress = 'Closed',
  Draft = 'Draft',
}

export enum ApprovedStatus {
  Approved = 'Approved',
  NotApproved = 'Not Approved',
  Requested = 'Requested',
  In_Review = 'In Review',
}

export enum Is_Accepted {
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export enum TodoType {
  'Job Application',
  'College Application',
  'Event - Arts',
  'Event - Sports',
  'Event - Social',
  'Event - Volunteer',
  'Other',
  'Education',
  'Employment',
}

export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(Status)
  @IsNotEmpty()
  @IsString()
  status: Status;

  @IsEnum(ApprovedStatus)
  @IsNotEmpty()
  @IsString()
  approved_status: ApprovedStatus;i

  @IsEnum(TodoType)
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  venue: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  eventAt: string;

  @IsString()
  completeBy: string;

  @IsString()
  listedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignee: string[];

  @IsOptional()
  @IsString()
  instituteId: string;
}

export class CreateTodoV2Dto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional() 
  description: string;

  @IsOptional()
  @IsEnum(Status)
  @IsString()
  status: string;

  @IsOptional()
  @IsEnum(TodoType)
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  venue: string;

  @IsOptional()
  @IsString()
  eventAt: string;

  @IsOptional()
  @IsString()
  completeBy: string;

  @IsString()
  listedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignee: string[];

  @IsOptional()
  @IsString()
  InstituteId: string;
  
  @IsOptional()
  @IsString()
  Todo_Scope: string;

  @IsOptional()
  @IsString()
  reminderAt: string;
}

export class CreateTodoResponse {
  statusCode: number;

  message: string;

  groupId: string;

  ids: [string];
}

export class AssigneeInfoDto {
  Id: string;

  name: string;

  profilePicture: string;

  status: string;

  Archived: boolean;

  todoId: string;
}

export class AssigneeInfoDtoV2 {
  Id: string;

  name: string;

  profilePicture: string;

  status: string;

  Archived: boolean;

  todoId: string;

  acceptedStatus: string;
}
