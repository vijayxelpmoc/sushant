import { IsOptional, IsString } from 'class-validator';

export class CreateSFCredentialDto {
  @IsString()
  @IsOptional()
  instituteName: string;

  @IsString()
  @IsOptional()
  loginUrl: string;

  @IsString()
  @IsOptional()
  clientId: string;

  @IsString()
  @IsOptional()
  clientSecret: string;

  @IsString()
  @IsOptional()
  redirectUri: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  grantType: string;
}
