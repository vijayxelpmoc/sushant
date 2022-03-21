import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class AddProfilePictureDto {
  @IsString()
  @IsUrl()
  @ApiProperty({ type: String })
  url: string;
}
