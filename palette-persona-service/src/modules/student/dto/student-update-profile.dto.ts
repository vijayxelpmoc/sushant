import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class StudentUpdateProfileDto {
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  interests: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  skills: string[];

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
  websiteTitle: string;

  @IsOptional()
  @IsString()
  github: string;

  @IsOptional()
  @IsString()
  linkedin: string;
}