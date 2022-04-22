import { IsOptional, IsString } from 'class-validator';

export class CreateSFModelDto {
  @IsString()
  @IsOptional()
  crmId?: string;

  @IsString()
  @IsOptional()
  objectGlobalKeyname?: string;

  @IsString()
  @IsOptional()
  objectCrmKeyname?: string;
}
