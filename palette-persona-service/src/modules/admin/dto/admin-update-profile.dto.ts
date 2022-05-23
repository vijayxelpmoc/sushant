


import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSfAdminDto {
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
  @IsUrl()
  linkedin: string;
}
