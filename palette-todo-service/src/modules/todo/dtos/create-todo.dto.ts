import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsEnum(Status)
  @IsNotEmpty()
  @IsString()
  status: Status;

  @ApiProperty()
  @IsEnum(ApprovedStatus)
  @IsNotEmpty()
  @IsString()
  approved_status: ApprovedStatus;

  @ApiProperty()
  @IsEnum(TodoType)
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  venue: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  eventAt: string;

  @ApiProperty()
  @IsString()
  completeBy: string;

  @ApiProperty()
  @IsString()
  listedBy: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignee: string[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  instituteId: string;
}

export class CreateTodoResponse {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  ids: [string];
}

export class AssigneeInfoDto {
  @ApiProperty()
  Id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  profilePicture: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  Archived: boolean;

  @ApiProperty()
  todoId: string;
}
