import { IsOptional, IsString } from 'class-validator';

export class CreateSFFieldDto {
  @IsString()
  @IsOptional()
  crmId: string;

  @IsString()
  @IsOptional()
  objectName: string;

  @IsString()
  @IsOptional()
  globalKeyname: string;

  @IsString()
  @IsOptional()
  crmKeyname: string;

  @IsString()
  @IsOptional()
  relatedToObject: string;

  @IsString()
  @IsOptional()
  datatype: string;
}
