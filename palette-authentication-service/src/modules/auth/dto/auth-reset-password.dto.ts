import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  newPassword: string;
}
