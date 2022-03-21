import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSfObserverDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebook_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsapp_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website_Title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  github_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedin_link: string;
}
