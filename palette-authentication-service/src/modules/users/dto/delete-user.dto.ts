import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DeleteUserDto {
  @IsEmail()
  @ApiProperty({ type: String })
  email: string;
}
