import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class ReportIssueDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  type: string;
  
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  needed_by: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  screenshots: string[];
}
