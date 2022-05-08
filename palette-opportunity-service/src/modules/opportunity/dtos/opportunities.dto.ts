import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum OpportunitiesTypesEnum {
  'Event - Volunteer',
  'Event - Arts',
  'Event - Sports',
  'Event - Social',
  'Other',
  'Education',
  'Employment',
  // 'Job Application',
  // 'College Application',
}

export class OpportunitiesInfoDto {
  @IsNotEmpty()
  @IsString()
  eventTitle: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  eventDateTime: Date;

  @IsOptional()
  expirationDateTime: Date;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  website: string;

  @IsNotEmpty()
  @IsString()
  venue: string;

  @IsEnum(OpportunitiesTypesEnum)
  @IsNotEmpty()
  @IsString()
  eventType: string;

  @IsOptional()
  assignees: string[];

  @IsOptional()
  InstituteId: string;
}

export class DraftInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eventTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  eventDateTime: Date;

  @ApiProperty()
  @IsOptional()
  expirationDateTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  website: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  venue: string;

  @ApiProperty()
  @IsString()
  eventType: string;

  @IsOptional()
  assignees: string[];

  @IsOptional()
  InstituteId: string;
}

export class TestDto {
  @IsNotEmpty()
  @IsString()
  eventTitle: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  eventDateTime: Date;

  @IsOptional()
  expirationDateTime: Date;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  website: string;

  @IsNotEmpty()
  @IsString()
  venue: string;

  @IsEnum(OpportunitiesTypesEnum)
  @IsNotEmpty()
  @IsString()
  eventType: string;
}

export class ConsiderationInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(OpportunitiesTypesEnum)
  category: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  website: string;

  @IsNotEmpty()
  @IsString()
  venue: string;
}

export class OpportunitiesUsersListDto {
  @IsNotEmpty()
  @IsString()
  Id: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  grade: string;

  @IsOptional()
  @IsString()
  profilePicture: string;

  @IsOptional()
  @IsString()
  institute: string;

  @IsOptional()
  @IsBoolean()
  isRegistered: boolean;
}

export class OpportunityTodoDto {
  @IsNotEmpty()
  opportunityIds: string[];

  @IsOptional()
  assigneesIds: string[];

  @IsOptional()
  InstituteId: string;
}

export class CreateDraftOpportunityDto {
  @ApiProperty()
  @IsNotEmpty()
  opportunitiesInfoDto: DraftInfoDto;

  @ApiProperty()
  @IsOptional()
  assignees: string[];

  @ApiProperty()
  @IsOptional()
  InstituteId: string;
}

export class SetDraftOpportunityStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  opportunityId: string;
}

export class DeleteOpportunityDto {
  @ApiProperty()
  @IsNotEmpty()
  opportunityIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  message: string;
}

export class CommentsDto {
  @ApiProperty()
  Id: string;
  @ApiProperty()
  ProfilePicture: string;
  @ApiProperty()
  CreatorName: string;
  @ApiProperty()
  Comment: string;
  @ApiProperty()
  PostedAt: string;
}

export class AllCommentsDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: CommentsDto[];
}
