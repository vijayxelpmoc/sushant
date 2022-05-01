


import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSfAdminDto {
  @IsOptional()
  @IsUrl()
  facebook: string;

  @IsOptional()
  @IsString()
  whatsapp: string;

  @IsOptional()
  @IsUrl()
  instagram: string;

  @IsOptional()
  @IsUrl()
  website: string;

  @IsOptional()
  @IsString()
  websiteTitle: string;

  @IsOptional()
  @IsUrl()
  github: string;

  @IsOptional()
  @IsUrl()
  linkedin: string;
}
