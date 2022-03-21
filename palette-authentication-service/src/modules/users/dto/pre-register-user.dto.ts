import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
} from 'class-validator';

import { Roles } from '@src/modules/users/types';

export class PreRegisterUserDto {
  @IsString()
  @IsEmail()
  @ApiProperty({ type: String })
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ type: String })
  password: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean })
  ferpa: boolean;

  @IsString()
  @IsEnum(Roles)
  @ApiProperty({ enum: Roles, enumName: 'Roles' })
  role: string;
}
