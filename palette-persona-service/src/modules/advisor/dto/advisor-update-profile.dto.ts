import { IsOptional, IsString } from 'class-validator';

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