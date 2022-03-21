import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsUUID, IsString } from 'class-validator';

export class AuthForgotPasswordSetNewDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ type: String })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  newPassword: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ type: String })
  senderValidationId: string;
}
