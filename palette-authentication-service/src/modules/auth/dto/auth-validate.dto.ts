import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class AuthValidateDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ type: String })
  email: string;
}
