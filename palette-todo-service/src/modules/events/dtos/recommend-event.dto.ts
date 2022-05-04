import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RecommendEventDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsArray()
  @IsNotEmpty()
  assigneeIds: Array<string>;
}
