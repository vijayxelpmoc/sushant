import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSfAdvisorDto {
  @IsOptional()
  @IsString()
  facebook: string;

  @IsOptional()
  @IsString()
  whatsapp: string;

  @IsOptional()
  @IsString()
  instagram: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  website_Title: string;

  @IsOptional()
  @IsString()
  github: string;

  @IsOptional()
  @IsString()
  linkedin: string;
}

export class EventStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum({ Accept: 'Accept', Reject: 'Reject' })
  status: string;

  // @IsNotEmpty()
  // @IsString()
  // notificationId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;
}