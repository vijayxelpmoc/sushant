import { IsOptional, IsString } from 'class-validator';

export class PawsSFCredentialDto {
    @IsString()
    @IsOptional()
    instituteId: string;

    @IsString()
    @IsOptional()
    instituteName: string;

    @IsString()
    @IsOptional()
    clientId: string;

    @IsString()
    @IsOptional()
    clientSecret: string;

    @IsString()
    @IsOptional()
    baseCrmId: string;
}
