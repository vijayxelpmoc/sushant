import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EventTodoDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsString()
  @IsOptional()
  listedBy: string;
}
