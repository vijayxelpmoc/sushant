import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export interface SFContactDetail {
  Id: string;
  AccountId: string;
  Name: string;
  RecordTypeId: string;
  Palette_Email__c: string;
  Palette_Key__c: string;
  Phone: string;
  IsRegisteredOnPalette__c: boolean;
  Record_Type_Name__c: string;
  prod_uuid__c: string;
  dev_uuid__c: string;
  Is_Deactive__c: boolean;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  role: string;
  userId: string;
  uuid: string;
  data: { accessToken: string; refreshToken: string };
}

export interface ForgotPassword {
  message: string;
  error: string;
  status: string;
}
export interface PreRegisterResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface BasicResponse {
  statusCode: number;
  message: string;
}

export interface BasicErrorResponse {
  status: string;
  message: string;
  error: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface BasicDataResponse {
  statusCode: number;
  message: string;
  data: any;
}

export class BasicDataResponseDto {
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: any;
}

export class ArchiveTaskDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    taskId: string;
  
    @ApiProperty()
    @IsNotEmpty()
    @IsBoolean()
    archived: boolean;
  }