import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RecommendEventDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty({ required: true })
  @IsArray()
  @IsNotEmpty()
  assigneeIds: Array<string>;
}
