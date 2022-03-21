import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EventTodoDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  listedBy: string;
}
